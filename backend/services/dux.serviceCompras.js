import axios from 'axios';
import { Categoria, Subcategoria, Proveedor, MateriaPrima } from '../models/index.js';

const API_URL_COMPRAS = process.env.DUX_API_URL_COMPRAS;
const EMPRESA = process.env.DUX_API_EMPRESA;
const SUCURSAL = process.env.DUX_API_SUCURSAL_CASA_CENTRAL;
const API_KEY = process.env.DUX_API_KEY;

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseFloatSeguro(valor) {
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
}

async function obtenerConReintentos(url, params = {}, reintentos = 5) {
  for (let i = 0; i < reintentos; i++) {
    try {
      const res = await axios.get(url, {
        headers: {
          accept: 'application/json',
          authorization: API_KEY
        },
        params
      });
      return res.data.results || [];
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`⚠️ 429 Too Many Requests: esperando 15s (intento ${i + 1})...`);
        await esperar(15000);
      } else if (error.code === 'ECONNRESET') {
        console.warn(`🔁 ECONNRESET en ${url}, intento ${i + 1}...`);
        await esperar(3000 + i * 2000);
      } else {
        throw error;
      }
    }
  }
  throw new Error(`❌ Fallaron todos los intentos para ${url}`);
}

export async function sincronizarComprasDesdeDux(diasAtras) {
  const fechaHasta = new Date();
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaHasta.getDate() - diasAtras);
  const desde = fechaDesde.toISOString().split('T')[0]; // "YYYY-MM-DD"
  const hasta = fechaHasta.toISOString().split('T')[0];
  const limit = 50;
  let offset = 0;

  let creadas = 0;
  let actualizadas = 0;
  let totalProcesadas = 0;

  console.log(`⏳ Iniciando sincronización de facturas desde ${desde} hasta ${hasta}...`);

  while (true) {
    // La URL de facturas puede necesitar el API_URL_COMPRAS del entorno
    const url = `${API_URL_COMPRAS}?fechaDesde=${desde}&fechaHasta=${hasta}&idEmpresa=${EMPRESA}&idSucursal=${SUCURSAL}&limit=${limit}&offset=${offset}`;
    console.log(`➡️ Consultando offset ${offset}...`);

    let facturas;
    try {
      // Usa la función global obtenerConReintentos
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
