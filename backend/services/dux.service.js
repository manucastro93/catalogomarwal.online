import axios from 'axios';
import { Categoria, Producto, Factura, PedidoDux, DetalleFactura, DetallePedidoDux } from '../models/index.js';
import { estadoSync } from '../state/estadoSync.js';

const API_URL = process.env.DUX_API_URL_PRODUCTOS;
const API_URL_FACTURAS = process.env.DUX_API_URL_FACTURAS;
const EMPRESA = process.env.DUX_API_EMPRESA;
const SUCURSAL = process.env.DUX_API_SUCURSAL_CASA_CENTRAL;
const API_KEY = process.env.DUX_API_KEY;
const NOMBRE_LISTA_GENERAL = process.env.DUX_LISTA_GENERAL;


function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcularStock(item) {
  if (!Array.isArray(item.stock)) return 0;
  return item.stock.reduce((acc, s) => acc + parseFloat(s.stock_disponible || '0'), 0);
}

function obtenerPrecioLista(listas, nombreBuscado) {
  if (!Array.isArray(listas)) return 0;
  const lista = listas.find(p => p.nombre?.toUpperCase().includes(nombreBuscado.toUpperCase()));
  return lista ? parseFloat(lista.precio || '0') : 0;
}

function limpiarNombreCategoria(nombre) {
  return typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Sin categoría';
}

export async function obtenerCategoriasDesdeDux(reintento = 0) {
  try {
    const res = await axios.get(`${API_URL}/rubros`, {
      headers: { Authorization: API_KEY, Accept: 'application/json' }
    });
    return res.data.results || [];
  } catch (error) {
    if (error.response?.status === 429 && reintento < 5) {
      const espera = 5000 * (reintento + 1);
      console.warn(`⏳ Esperando ${espera / 1000}s por 429... Reintento #${reintento + 1}`);
      await esperar(espera);
      return obtenerCategoriasDesdeDux(reintento + 1);
    }
    console.error('❌ Error al obtener rubros desde Dux:', error.response?.status, error.response?.data);
    throw error;
  }
}

export async function obtenerTodosLosItemsDesdeDux() {
  const todos = [];
  let offset = 0;
  const limit = 50;
  let pagina = 1;
  let total = 1;

  while (true) {
    console.log(`📦 Pidiendo página ${pagina} (offset ${offset})`);
    const lote = await intentarObtenerPagina(offset, limit, pagina);

    if (!lote?.items?.length) break;
    console.log(`🔍 Página ${pagina} → items: ${lote.items.length}, total: ${lote.total}`);

    if (pagina === 1 && lote.total) {
      total = lote.total;
    }

    todos.push(...lote.items);
    estadoSync.porcentaje = Math.floor((todos.length / total) * 100);

    offset += limit;
    pagina++;

    if (offset >= total) break;

    console.log('⏳ Esperando 5 segundos por rate-limit Dux...');
    await esperar(5000);
  }

  return todos;
}

async function intentarObtenerPagina(offset, limit, pagina, reintento = 0) {
  try {
    const res = await axios.get(`${API_URL}/items`, {
      headers: { Authorization: API_KEY, Accept: 'application/json' },
      params: { offset, limit }
    });

    return {
      items: res.data.results,
      total: res.data.paging?.total || 0
    };
  } catch (error) {
    if (error.response?.status === 429 && reintento < 5) {
      const espera = 5000 * (reintento + 1);
      console.warn(`⚠️ 429 en página ${pagina}. Esperando ${espera / 1000}s... Reintento #${reintento + 1}`);
      await esperar(espera);
      return intentarObtenerPagina(offset, limit, pagina, reintento + 1);
    }

    console.error(`❌ Error al obtener página ${pagina}:`, error.message);
    throw error;
  }
}

export async function sincronizarProductosDesdeDux() {
  estadoSync.porcentaje = 0;

  // Paso 1: sincronizar categorías
  await esperar(5000);
  const rubros = await obtenerCategoriasDesdeDux();
  const categoriasCreadas = new Set();

  for (const rubro of rubros) {
    const nombre = limpiarNombreCategoria(rubro.nombre);

    const existente = await Categoria.findOne({ where: { nombre } });

    if (!existente) {
      const nueva = await Categoria.create({
        nombre,
        nombreWeb: nombre,
        orden: 0,
        estado: true
      });
      categoriasCreadas.add(nueva.id);
    }
  }

  // Cargar todas las categorías en memoria para lookup rápido
  const todasCategorias = await Categoria.findAll();
  const categoriasMap = {};
  for (const cat of todasCategorias) {
    categoriasMap[limpiarNombreCategoria(cat.nombre)] = cat.id;
  }

  // Paso 2: sincronizar productos
  const items = await obtenerTodosLosItemsDesdeDux();

  let creados = 0;
  let actualizados = 0;

  for (const item of items) {
    try {
      const sku = String(item.cod_item).trim();
      let categoriaId = null;

      const productoExistente = await Producto.findOne({
        where: { sku }
      });

      if (productoExistente?.categoriaId) {
        categoriaId = productoExistente.categoriaId;
      } else {
        const nombreCategoria = limpiarNombreCategoria(item.rubro?.nombre || '');
        categoriaId = categoriasMap[nombreCategoria] || 11;
      }

      let precio = obtenerPrecioLista(item.precios, NOMBRE_LISTA_GENERAL);
      if (!precio || precio === 0) {
        precio = obtenerPrecioLista(item.precios, 'RETAIL');
      }
      precio = Math.round(precio / 1.21);

      const data = {
        nombre: item.item,
        sku,
        precioUnitario: precio,
        costoDux: parseFloat(item.costo || '0'),
        stock: calcularStock(item),
        categoriaId,
        activo: true
      };

      if (productoExistente) {
        await productoExistente.update(data);
        actualizados++;
      } else {
        await Producto.create(data);
        creados++;
      }

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.warn(`⚠️ SKU duplicado: ${item.cod_item}, se omite creación`);
      } else {
        console.error(`❌ Error procesando item ${item.cod_item}:`, error);
      }
    }
  }

  console.log('\n🎉 Sincronización finalizada.');
  setTimeout(() => {
    estadoSync.porcentaje = 0;
  }, 3000);

  estadoSync.ultimaActualizacionProductos = Date.now();

  return {
    mensaje: `Se sincronizaron ${items.length} productos desde Dux.`,
    creados,
    actualizados,
    categoriasNuevas: categoriasCreadas.size
  };
}

export async function sincronizarPedidosDesdeDux() {
  const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const fechaHasta = new Date();
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaHasta.getDate() - 20);
  const desde = fechaDesde.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const hasta = fechaHasta.toISOString().split('T')[0];

  let offset = 0;
  const limit = 50;
  let totalProcesados = 0, creados = 0, actualizados = 0;

  function parseFloatSeguro(valor) {
    const n = parseFloat(valor);
    return isNaN(n) ? 0 : n;
  }

  console.log(`⏳ Iniciando sincronización de pedidos Dux desde ${desde} hasta ${hasta}...`);

  try {
    while (true) {
      console.log(`➡️ Consultando offset ${offset}...`);

      let res;
      try {
        res = await axios.get('https://erp.duxsoftware.com.ar/WSERP/rest/services/pedidos', {
          headers: {
            Authorization: process.env.DUX_API_KEY,
            Accept: 'application/json',
          },
          params: {
            idEmpresa: EMPRESA,
            idSucursal: SUCURSAL,
            fechaDesde: desde,
            fechaHasta: hasta,
            limit,
            offset
          },
        });
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn(`⚠️ 429 Too Many Requests. Esperando 15s antes de reintentar offset ${offset}...`);
          await esperar(15000);
          continue;
        }

        console.error('❌ Error al consultar pedidos:', error.message);
        throw error;
      }

      const pedidos = res.data.results || [];
      if (pedidos.length === 0) {
        console.log(`✅ No se encontraron más pedidos. Finalizando.`);
        break;
      }

      for (const p of pedidos) {
        const existente = await PedidoDux.findOne({ where: { nro_pedido: p.nro_pedido } });

        const data = {
          nro_pedido: p.nro_pedido,
          cliente: p.cliente,
          personal: p.personal,
          fecha: new Date(p.fecha),
          total: parseFloatSeguro(p.total),
          estado_facturacion: p.estado_facturacion,
          observaciones: p.observaciones,
        };

        let pedido;

        if (existente) {
          await existente.update(data);
          pedido = existente;
          actualizados++;
          console.log(`🟡 Pedido ${p.nro_pedido} actualizado`);
        } else {
          pedido = await PedidoDux.create(data);
          creados++;
          console.log(`🟢 Pedido ${p.nro_pedido} creado`);
        }

        if (Array.isArray(p.detalles)) {
          for (const d of p.detalles) {
            const cantidad = parseFloatSeguro(d.ctd);
            const precioUnitario = parseFloatSeguro(d.precio_uni);
            const subtotal = cantidad * precioUnitario;
            const descuento = parseFloatSeguro(d.porc_desc);
            const descripcion = d.item;
            const codItem = d.cod_item;

            const existenteDetalle = await DetallePedidoDux.findOne({
              where: {
                pedidoDuxId: pedido.id,
                codItem: codItem
              }
            });

            const dataDetalle = {
              cantidad,
              precioUnitario,
              subtotal,
              descuento,
              descripcion
            };

            if (existenteDetalle) {
              await existenteDetalle.update(dataDetalle);
              console.log(`   🔄 Detalle actualizado (${codItem})`);
            } else {
              await DetallePedidoDux.create({
                pedidoDuxId: pedido.id,
                codItem,
                ...dataDetalle
              });
              console.log(`   ➕ Detalle agregado (${codItem})`);
            }
          }
        }

        await esperar(500); // descanso para evitar bloqueo
      }

      totalProcesados += pedidos.length;
      offset += limit;
    }

    console.log(`✅ Sincronización finalizada. Total procesados: ${totalProcesados}, creados: ${creados}, actualizados: ${actualizados}`);
    return {
      mensaje: `Finalizada. Procesados: ${totalProcesados}`,
      creados,
      actualizados
    };

  } catch (error) {
    console.error('❌ Error fatal fuera del ciclo:', error.message);
    throw error;
  }
}

export async function sincronizarFacturasDesdeDux() {
  const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const fechaHasta = new Date();
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaHasta.getDate() - 20);
  const desde = fechaDesde.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const hasta = fechaHasta.toISOString().split('T')[0];
  const limit = 50;
  let offset = 0;

  let creadas = 0;
  let actualizadas = 0;
  let totalProcesadas = 0;

  function parseFloatSeguro(valor) {
    const n = parseFloat(valor);
    return isNaN(n) ? 0 : n;
  }

  async function obtenerConReintentos(url, reintentos = 3) {
    for (let i = 0; i < reintentos; i++) {
      try {
        const res = await axios.get(url, {
          headers: {
            accept: 'application/json',
            authorization: API_KEY
          }
        });
        return res.data.results || [];
      } catch (error) {
        if (error.response?.status === 429) {
          console.warn(`⚠️ 429 Too Many Requests: esperando 15s (intento ${i + 1})...`);
          await esperar(15000);
        } else if (error.code === 'ECONNRESET') {
          console.warn(`🔁 ECONNRESET en offset ${offset}, intento ${i + 1}...`);
          await esperar(3000 + i * 2000);
        } else {
          throw error;
        }
      }
    }
    throw new Error(`❌ Fallaron todos los intentos para offset ${offset}`);
  }

  console.log(`⏳ Iniciando sincronización de facturas desde ${desde} hasta ${hasta}...`);

  while (true) {
    const url = `${API_URL_FACTURAS}?fechaDesde=${desde}&fechaHasta=${hasta}&idEmpresa=${EMPRESA}&idSucursal=${SUCURSAL}&limit=${limit}&offset=${offset}`;
    console.log(`➡️ Consultando offset ${offset}...`);

    let facturas;
    try {
      facturas = await obtenerConReintentos(url);
    } catch (error) {
      console.error('❌ Error al sincronizar facturas:', error.message);
      break;
    }

    if (facturas.length === 0) {
      console.log(`✅ No hay más facturas. Finalizando.`);
      break;
    }

    for (const f of facturas) {
      const existente = await Factura.findByPk(f.id);

      let estadoFacturaId = 1;
      if (f.anulada_boolean) {
        estadoFacturaId = 3;
      } else if (f.detalles_cobro?.[0]?.detalles_mov_cobro?.length > 0) {
        const totalCobrado = f.detalles_cobro
          .flatMap(dc => dc.detalles_mov_cobro)
          .reduce((sum, d) => sum + (parseFloatSeguro(d.monto)), 0);

        if (totalCobrado >= f.total) estadoFacturaId = 2;
        else if (totalCobrado > 0) estadoFacturaId = 4;
      }

      const data = {
        ...f,
        estadoFacturaId,
        fecha_comp: new Date(f.fecha_comp),
        fecha_vencimiento_cae_cai: f.fecha_vencimiento_cae_cai ? new Date(f.fecha_vencimiento_cae_cai) : null,
        fecha_registro: f.fecha_registro ? new Date(f.fecha_registro) : null,
        sincronizadoEl: new Date(),
      };

      let factura;

      if (existente) {
        await existente.update(data);
        factura = existente;
        actualizadas++;
        console.log(`🟡 Factura ${f.id} actualizada`);
      } else {
        factura = await Factura.create(data);
        creadas++;
        console.log(`🟢 Factura ${f.id} creada`);
      }

      // Detalles → tabla DetalleFacturas
      if (Array.isArray(f.detalles)) {
        for (const d of f.detalles) {
          const cantidad = parseFloatSeguro(d.ctd);
          const precioUnitario = parseFloatSeguro(d.precio_uni);
          const subtotal = cantidad * precioUnitario;
          const descuento = parseFloatSeguro(d.porc_desc);
          const costo = parseFloatSeguro(d.costo);
          const descripcion = d.item;
          const codItem = d.cod_item;

          if ([cantidad, precioUnitario, subtotal].some(v => isNaN(v))) {
            console.warn(`❌ NaN detectado en factura ${factura.id} (${codItem}). Detalle omitido:`, d);
            continue;
          }

          const existenteDetalle = await DetalleFactura.findOne({
            where: {
              facturaId: factura.id,
              codItem: codItem
            }
          });

          const dataDetalle = {
            cantidad,
            precioUnitario,
            subtotal,
            descuento,
            costo,
            descripcion
          };

          if (existenteDetalle) {
            await existenteDetalle.update(dataDetalle);
            console.log(`   🔄 Detalle actualizado (${codItem})`);
          } else {
            await DetalleFactura.create({
              facturaId: factura.id,
              codItem,
              ...dataDetalle
            });
            console.log(`   ➕ Detalle agregado (${codItem})`);
          }
        }

      }
    }

    totalProcesadas += facturas.length;
    offset += limit;
    await esperar(3000); // control de frecuencia
  }

  console.log(`✅ Sincronización de facturas finalizada. Total: ${totalProcesadas}, creadas: ${creadas}, actualizadas: ${actualizadas}`);

  return { creadas, actualizadas, total: totalProcesadas };
}