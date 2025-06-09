// 🔄 Librerías externas
import { Op, fn, col, where } from 'sequelize';
import { Factura, DetalleFactura, PedidoDux, DetallePedidoDux, Categoria, Producto } from '../models/index.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// --- Helpers generales ---
const formatFecha = (date) => {
  if (!date) return 'Sin Fecha';
  return dayjs(date).utc().format("DD-MM-YYYY");
};
const TIPOS_COMPROBANTE_VALIDOS = ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"];
const toFloat = (value) => parseFloat(value || 0);
const toFixed = (value, decimals = 2) =>
  isNaN(value) ? 0 : +parseFloat(value).toFixed(decimals);

/* 📦 FUNCIONES DE CONSULTA A BASE DE DATOS */

/**
 * 🔍 Trae facturas en un rango de fechas con sus detalles.
 * @param {Date} desde - Fecha de inicio del rango.
 * @param {Date} hasta - Fecha de fin del rango.
 * @returns {Promise<Array<Factura>>} Lista de facturas.
 */
export async function obtenerFacturasConDetallesEnRango(desde, hasta) {
  return await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [desde, hasta] },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['id', 'nro_pedido', 'fecha_comp', 'apellido_razon_soc'],
    include: [{
      model: DetalleFactura,
      as: 'detalles',
      attributes: ['id', 'codItem', 'cantidad', 'descripcion', 'precioUnitario']
    }]
  });
}

/**
 * 🔍 Trae pedidos por un array de números de pedido.
 * @param {Array<string>} nros - Array de números de pedido.
 * @returns {Promise<Array<PedidoDux>>} Lista de pedidos.
 */
export async function obtenerPedidosPorNro(nros) {
  return await PedidoDux.findAll({
    where: { nro_pedido: { [Op.in]: nros } },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente'],
  });
}

/**
 * 🔍 Trae detalles de pedidos por un array de IDs de pedido.
 * @param {Array<number>} pedidosId - Array de IDs de pedido.
 * @returns {Promise<Array<DetallePedidoDux>>} Lista de detalles de pedido.
 */
export async function obtenerDetallesPedidosPorId(pedidosId) {
  return await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: pedidosId } },
    attributes: ['id', 'pedidoDuxId', 'codItem', 'cantidad', 'descripcion', 'precioUnitario']
  });
}

/**
 * 🔍 Trae todas las categorías que no contengan "producción".
 * @returns {Promise<Array<Categoria>>} Lista de categorías válidas.
 */
export async function obtenerCategoriasValidasDB() {
  return await Categoria.findAll({
    where: where(fn('LOWER', col('nombre')), {
      [Op.notLike]: '%producción%'
    }),
    attributes: ['id', 'nombre']
  });
}

/**
 * 🔍 Trae productos con categoría ID para SKU específicos.
 * @param {Array<string>} skus - SKUs a buscar.
 * @returns {Promise<Array<Producto>>} Lista de productos.
 */
export async function obtenerProductosPorSkusYCategoria(skus) {
    return await Producto.findAll({
        where: {
            sku: { [Op.in]: skus },
            categoriaId: { [Op.ne]: null }
        },
        attributes: ['sku', 'categoriaId']
    });
}

/* 🧱 FUNCIONES DE PROCESAMIENTO Y AGRUPACIÓN DE DATOS */

/**
 * 🗂 Mapea detalles de pedido por ID de pedido.
 * @param {Array<DetallePedidoDux>} detallesPedidos - Detalles de pedidos a mapear.
 * @returns {Map<number, Array<DetallePedidoDux>>} Mapa de detalles por ID de pedido.
 */
export function mapearDetallesPedidosPorPedido(detallesPedidos) {
  const map = new Map();
  for (const detalle of detallesPedidos) {
    if (!map.has(detalle.pedidoDuxId)) {
      map.set(detalle.pedidoDuxId, []);
    }
    map.get(detalle.pedidoDuxId).push(detalle);
  }
  return map;
}

/**
 * 🧮 Mapea cantidad pedida de cada ítem por pedido.
 * @param {Array<DetallePedidoDux>} detalles - Detalles de pedidos.
 * @returns {Map<string, number>} Mapa con la clave `${pedidoId}-${codItem}` y la cantidad pedida.
 */
export function mapearCantidadPedidaPorItemEnPedido(detalles) {
  const map = new Map();
  for (const dp of detalles) {
    const clave = `${dp.pedidoDuxId}-${dp.codItem}`;
    map.set(clave, (map.get(clave) || 0) + toFloat(dp.cantidad));
  }
  return map;
}

/**
 * Unifica el procesamiento inicial de facturas para diversos mapeos y agregados.
 * @param {Array<Factura>} facturas - Lista de facturas con detalles.
 * @returns {object} Objeto con varios mapas y agregados de facturas.
 */
export function procesarFacturasParaMapeo(facturas) {
  const detallesFacturasPorPedido = new Map();
  const primeraFacturaPorPedido = new Map();
  const fechasFacturasPorPedido = new Map();
  const cantidadesFacturadasPorItemEnPedido = new Map();
  const valorFacturadoPorItemEnPedido = new Map();
  const fechaPrimeraFacturaPorItem = new Map();

  for (const factura of facturas) {
    const nroPedido = factura.nro_pedido;
    const fechaFacturaActual = factura.fecha_comp ? new Date(factura.fecha_comp) : null;

    if (factura.detalles && Array.isArray(factura.detalles)) {
      if (!detallesFacturasPorPedido.has(nroPedido)) {
        detallesFacturasPorPedido.set(nroPedido, []);
      }
      detallesFacturasPorPedido.get(nroPedido).push(...factura.detalles);

      for (const det of factura.detalles) {
        const codItem = det.codItem;
        const cantidad = toFloat(det.cantidad);
        const precio = toFloat(det.precioUnitario);

        const claveItemPedido = `${nroPedido}-${codItem}`;

        cantidadesFacturadasPorItemEnPedido.set(
          claveItemPedido,
          (cantidadesFacturadasPorItemEnPedido.get(claveItemPedido) || 0) + cantidad
        );
        valorFacturadoPorItemEnPedido.set(
          claveItemPedido,
          (valorFacturadoPorItemEnPedido.get(claveItemPedido) || 0) + (cantidad * precio)
        );

        if (fechaFacturaActual) {
            if (!fechaPrimeraFacturaPorItem.has(codItem) || fechaFacturaActual < fechaPrimeraFacturaPorItem.get(codItem)) {
                fechaPrimeraFacturaPorItem.set(codItem, fechaFacturaActual);
            }
        }
      }
    }

    if (!primeraFacturaPorPedido.has(nroPedido)) {
      primeraFacturaPorPedido.set(nroPedido, factura);
    }

    if (!fechasFacturasPorPedido.has(nroPedido)) {
      fechasFacturasPorPedido.set(nroPedido, new Set());
    }
    if (factura.fecha_comp) {
      fechasFacturasPorPedido.get(nroPedido).add(formatFecha(factura.fecha_comp));
    }
  }

  const fechasFacturasArrayPorPedido = new Map();
  for (const [nroPedido, fechasSet] of fechasFacturasPorPedido.entries()) {
    fechasFacturasArrayPorPedido.set(nroPedido, [...fechasSet].sort());
  }

  return {
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaPrimeraFacturaPorItem,
  };
}

/**
 * 🗂 Prepara mapeos de categorías y productos.
 * @param {Array<Categoria>} categorias - Lista de categorías.
 * @param {Array<Producto>} productos - Lista de productos.
 * @returns {object} Objeto con mapeos de categorías y productos.
 */
export function prepararMapeosCategoriasYProductos(categorias, productos) {
    const categoriasValidas = new Set(categorias.map(c => c.id));
    const categoriaNombreMap = new Map(categorias.map(c => [c.id, c.nombre]));
    const productoCategoriaMap = new Map(productos.map(p => [p.sku, p.categoriaId]));
    return { categoriasValidas, categoriaNombreMap, productoCategoriaMap };
}

/**
 * 🗂 Agrupa y calcula cantidades pedidas y facturadas por producto.
 * @param {Array<DetallePedidoDux>} detallesPedidos - Detalles de pedidos.
 * @param {Array<DetalleFactura>} detallesFacturas - Detalles de facturas (aplanados).
 * @returns {Array<object>} Resumen de productos con pedida, facturada y diferencia.
 */
export function construirResumenDetallePorProducto(detallesPedidos, detallesFacturas) {
  const map = new Map();

  for (const dp of detallesPedidos) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!map.has(key)) {
      map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
    }
    map.get(key).pedida += toFloat(dp.cantidad);
  }

  for (const df of detallesFacturas) {
    const key = df.codItem;
    const desc = df.descripcion || key;
    if (!map.has(key)) {
      map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
    }
    map.get(key).facturada += toFloat(df.cantidad);
  }

  return Array.from(map.values()).map(item => ({
    ...item,
    diferencia: toFixed(item.facturada - item.pedida)
  }));
}

/* 📊 FUNCIONES DE CÁLCULO Y REPORTE */

/**
 * 📈 Genera el reporte de evolución mensual (fill rate y lead time).
 * @param {object} params - Parámetros para el cálculo.
 * @param {Array<Factura>} params.facturas - Facturas con detalles.
 * @param {Map<string, PedidoDux>} params.pedidosPorNro - Pedidos mapeados por número de pedido.
 * @param {Map<string, number>} params.cantidadesPedidasPorItemEnPedido - Cantidades pedidas por item y pedido.
 * @returns {Array<object>} Reporte de evolución mensual.
 */
export function generarReporteEvolucionMensual({ facturas, pedidosPorNro, cantidadesPedidasPorItemEnPedido }) {
  const dataPorMes = {};
  const consumidos = new Map();
  const yaContadosCantPedida = new Set();

  for (const factura of facturas) {
    const pedido = pedidosPorNro.get(factura.nro_pedido);
    if (!pedido || !pedido.fecha) continue;

    const mes = dayjs(pedido.fecha).format("YYYY-MM");
    dataPorMes[mes] ||= { pedida: 0, facturada: 0, totalLeadTime: 0, countLeadTime: 0 };

    const fechaFactura = new Date(factura.fecha_comp);
    const fechaPedido = new Date(pedido.fecha);
    const dias = Math.max(0, Math.round((fechaFactura - fechaPedido) / (1000 * 60 * 60 * 24)));

    dataPorMes[mes].totalLeadTime += dias;
    dataPorMes[mes].countLeadTime += 1;

    for (const df of factura.detalles) {
      const codItem = (df.codItem || "").toLowerCase().trim();
      const clavePedidoItem = `${pedido.id}-${codItem}`;

      const pedida = cantidadesPedidasPorItemEnPedido.get(clavePedidoItem) || 0;
      const yaConsumido = consumidos.get(clavePedidoItem) || 0;
      const facturadaActual = toFloat(df.cantidad);

      const restante = Math.max(0, pedida - yaConsumido);
      const cantidadEfectiva = Math.min(restante, facturadaActual);

      if (cantidadEfectiva === 0 && yaConsumido > 0) continue;

      consumidos.set(clavePedidoItem, yaConsumido + cantidadEfectiva);
      dataPorMes[mes].facturada += cantidadEfectiva;

      const uniqueItemMesKey = `${clavePedidoItem}-${mes}`;
      if (!yaContadosCantPedida.has(uniqueItemMesKey)) {
        dataPorMes[mes].pedida += pedida;
        yaContadosCantPedida.add(uniqueItemMesKey);
      }
    }
  }

  return Object.entries(dataPorMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      fillRate: v.pedida > 0
        ? toFixed(Math.min(v.facturada / v.pedida, 1) * 100)
        : 0,
      leadTime: v.countLeadTime > 0
        ? toFixed(v.totalLeadTime / v.countLeadTime)
        : null
    }));
}

/**
 * 🎯 Calcula y formatea el resumen de eficiencia por cliente.
 * @param {object} params - Parámetros de datos.
 * @param {Array<PedidoDux>} params.pedidos - Pedidos filtrados.
 * @param {Map<number, Array<DetallePedidoDux>>} params.detallesPedidosPorPedido - Detalles de pedidos mapeados por ID.
 * @param {Map<string, Array<DetalleFactura>>} params.detallesFacturasPorPedido - Detalles de facturas mapeados por nro_pedido.
 * @param {Map<string, Factura>} params.primeraFacturaPorPedido - Primera factura por nro_pedido.
 * @returns {Array<object>} Resumen de eficiencia por cliente.
 */
export function generarResumenEficienciaPorCliente({ pedidos, detallesPedidosPorPedido, detallesFacturasPorPedido, primeraFacturaPorPedido }) {
  const resumenPorCliente = new Map();

  for (const pedido of pedidos) {
    const nombreCliente = pedido.cliente || "Sin nombre";
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const detallesF = detallesFacturasPorPedido.get(pedido.nro_pedido) || [];
    const facturaPrincipal = primeraFacturaPorPedido.get(pedido.nro_pedido);

    const cantidadPedida = detallesP.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
    const totalPedido = detallesP.reduce((acc, d) =>
      acc + (toFloat(d.cantidad) * toFloat(d.precioUnitario)), 0);

    const cantidadFacturada = detallesF.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
    const totalFacturado = detallesF.reduce((acc, d) =>
      acc + (toFloat(d.cantidad) * toFloat(d.precioUnitario)), 0);

    const leadTimeDias = (facturaPrincipal && cantidadFacturada > 0 && pedido.fecha && facturaPrincipal.fecha_comp)
      ? Math.max(0, Math.round((new Date(facturaPrincipal.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
      : null;

    if (!resumenPorCliente.has(nombreCliente)) {
      resumenPorCliente.set(nombreCliente, {
        cliente: nombreCliente,
        cantidadPedida: 0,
        cantidadFacturada: 0,
        totalPedido: 0,
        totalFacturado: 0,
        totalLeadTime: 0,
        countLeadTime: 0
      });
    }

    const entry = resumenPorCliente.get(nombreCliente);
    entry.cantidadPedida += cantidadPedida;
    entry.cantidadFacturada += cantidadFacturada;
    entry.totalPedido += totalPedido;
    entry.totalFacturado += totalFacturado;
    if (leadTimeDias !== null) {
      entry.totalLeadTime += leadTimeDias;
      entry.countLeadTime += 1;
    }
  }

  return Array.from(resumenPorCliente.values())
    .map(entry => {
      const fillRate = entry.cantidadPedida > 0
        ? toFixed(Math.min(entry.cantidadFacturada / entry.cantidadPedida, 1) * 100)
        : 0;

      const fillRatePonderado = entry.totalPedido > 0
        ? toFixed(Math.min(entry.totalFacturado / entry.totalPedido, 1) * 100)
        : 0;

      const leadTimePromedio = entry.countLeadTime > 0
        ? toFixed(entry.totalLeadTime / entry.countLeadTime)
        : null;

      return {
        cliente: entry.cliente,
        cantidadPedida: toFixed(entry.cantidadPedida),
        cantidadFacturada: toFixed(entry.cantidadFacturada),
        totalPedido: toFixed(entry.totalPedido),
        totalFacturado: toFixed(entry.totalFacturado),
        fillRate,
        fillRatePonderado,
        leadTimePromedio
      };
    })
    .sort((a, b) => a.cliente.localeCompare(b.cliente));
}

/**
 * 🎯 Formatea el detalle completo de un pedido, incluyendo sus productos.
 * @param {object} params - Parámetros con datos del pedido y sus componentes.
 * @returns {object} Resumen detallado de un pedido.
 */
export function generarDetallePorPedido({
  pedido,
  detallesPedido,
  fechasFacturasArray,
  primeraFacturaPedido,
  cantidadesFacturadasPorItemEnPedido,
  valorFacturadoPorItemEnPedido,
  fechaPrimeraFacturaPorItem
}) {
  let totalCantidadPedida = 0;
  let totalValorPedido = 0;
  let totalCantidadFacturada = 0;
  let totalValorFacturado = 0;

  const productos = detallesPedido.map(p => {
    const pedida = toFloat(p.cantidad);
    const precioUnitarioPedido = toFloat(p.precioUnitario);
    const claveItemPedido = `${pedido.nro_pedido}-${p.codItem}`;

    const facturada = cantidadesFacturadasPorItemEnPedido.get(claveItemPedido) || 0;
    const valorFacturadoItem = valorFacturadoPorItemEnPedido.get(claveItemPedido) || 0;

    totalCantidadPedida += pedida;
    totalValorPedido += pedida * precioUnitarioPedido;
    totalCantidadFacturada += facturada;
    totalValorFacturado += valorFacturadoItem;

    const fillRate = pedida > 0 ? toFixed(Math.min(facturada / pedida, 1) * 100) : 0;
    let leadTimeItem = null;

    const primeraFacturaItemFecha = fechaPrimeraFacturaPorItem.get(p.codItem);
    if (facturada > 0 && primeraFacturaItemFecha && pedido.fecha) {
      leadTimeItem = Math.max(
        0,
        Math.round((primeraFacturaItemFecha - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      codItem: p.codItem,
      descripcion: p.descripcion || "Sin descripción",
      cantidadPedida: toFixed(pedida),
      cantidadFacturada: toFixed(facturada),
      fillRate,
      precioUnitarioPedido: toFixed(precioUnitarioPedido),
      valorFacturadoItem: toFixed(valorFacturadoItem),
      leadTimeItem
    };
  });

  const fillRatePedido = totalCantidadPedida > 0
    ? toFixed(Math.min(totalCantidadFacturada / totalCantidadPedida, 1) * 100)
    : 0;

  const fillRatePonderado = totalValorPedido > 0
    ? toFixed(Math.min(totalValorFacturado / totalValorPedido, 1) * 100)
    : 0;

  let leadTimePedido = null;
  if (primeraFacturaPedido && totalCantidadFacturada > 0 && pedido.fecha && primeraFacturaPedido.fecha_comp) {
    leadTimePedido = Math.max(0, Math.round((new Date(primeraFacturaPedido.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
  }

  return {
    pedidoId: pedido.id,
    nroPedido: pedido.nro_pedido,
    fechaPedido: formatFecha(pedido.fecha),
    fechasFacturas: fechasFacturasArray.length > 0 ? fechasFacturasArray.join(', ') : '—',
    cantidadPedida: toFixed(totalCantidadPedida),
    cantidadFacturada: toFixed(totalCantidadFacturada),
    fillRate: toFixed(fillRatePedido),
    leadTimeDias: leadTimePedido,
    totalPedidoValor: toFixed(totalValorPedido),
    totalFacturadoValor: toFixed(totalValorFacturado),
    fillRatePonderado: toFixed(fillRatePonderado),
    productos
  };
}

/**
 * ✅ MEJORA: Genera el reporte de eficiencia por producto, unificando la lógica de agrupación y cálculo.
 * @param {Array<DetallePedidoDux>} detallesPedidos - Todos los detalles de pedidos.
 * @param {Array<Factura>} facturasCompletas - Todas las facturas con sus detalles.
 * @param {Map<string, Date>} pedidoFechaMap - Mapa de nro_pedido a fecha de pedido.
 * @param {string} [filtro=""] - Filtro opcional por codItem o descripción.
 * @returns {Array<object>} Reporte de eficiencia por producto.
 */
export function generarReporteEficienciaPorProducto(detallesPedidos, facturasCompletas, pedidoFechaMap, filtro = "") {
  const pedidasPorProducto = new Map();
  const facturadasPorProducto = new Map();

  const lowerFiltro = filtro.toLowerCase();

  for (const dp of detallesPedidos) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!filtro || key.toLowerCase().includes(lowerFiltro) || desc.toLowerCase().includes(lowerFiltro)) {
      const current = pedidasPorProducto.get(key) || { producto: desc, pedida: 0 };
      current.pedida += toFloat(dp.cantidad);
      pedidasPorProducto.set(key, current);
    }
  }

  for (const factura of facturasCompletas) {
    if (!Array.isArray(factura.detalles)) continue;
    for (const df of factura.detalles) {
      const key = df.codItem;
      const desc = df.descripcion || key;
      if (!filtro || key.toLowerCase().includes(lowerFiltro) || desc.toLowerCase().includes(lowerFiltro)) {
        const current = facturadasPorProducto.get(key) || { producto: desc, facturada: 0, leadTimes: [] };
        current.facturada += toFloat(df.cantidad);

        const fechaPedido = pedidoFechaMap.get(factura.nro_pedido);
        if (fechaPedido && factura.fecha_comp) {
          const diff = Math.max(0, Math.round(
            (new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)
          ));
          current.leadTimes.push(diff);
        }
        facturadasPorProducto.set(key, current);
      }
    }
  }

  const allProductKeys = new Set([...pedidasPorProducto.keys(), ...facturadasPorProducto.keys()]);
  const result = [];

  for (const key of allProductKeys) {
    const pedidaData = pedidasPorProducto.get(key) || { producto: key, pedida: 0 };
    const facturadaData = facturadasPorProducto.get(key) || { facturada: 0, leadTimes: [] };

    const pedidas = pedidaData.pedida;
    const facturadas = facturadaData.facturada;
    const leadTimes = facturadaData.leadTimes;

    if (pedidas === 0 && facturadas === 0) continue;

    const fillRate = pedidas > 0 ? toFixed(Math.min(facturadas / pedidas, 1) * 100) : 0;
    const leadTimePromedio = leadTimes.length > 0
      ? toFixed(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

    result.push({
      producto: pedidaData.producto,
      cantidadPedida: toFixed(pedidas),
      cantidadFacturada: toFixed(facturadas),
      fillRate,
      leadTimePromedio
    });
  }
  return result;
}

/**
 * 🧠 Calcula y formatea el resumen de eficiencia por categoría.
 * @param {object} params - Parámetros de datos.
 * @returns {Array<object>} Resumen de eficiencia por categoría.
 */
export function generarResumenEficienciaPorCategoria({
  categoriaIdFiltro,
  categoriasValidas,
  categoriaNombreMap,
  productoCategoriaMap,
  pedidoFechaMap,
  detallesPedidos,
  facturasCompletas
}) {
  const resumen = new Map();

  for (const dp of detallesPedidos) {
    const codItem = dp.codItem;
    const catId = productoCategoriaMap.get(codItem);

    if (!catId || !categoriasValidas.has(catId) || (categoriaIdFiltro && catId != categoriaIdFiltro)) continue;

    const current = resumen.get(catId) || {
      nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
      cantidadPedida: 0,
      cantidadFacturada: 0,
      leadTimes: [],
    };
    current.cantidadPedida += toFloat(dp.cantidad);
    resumen.set(catId, current);
  }

  for (const factura of facturasCompletas) {
    for (const df of factura.detalles || []) {
      const codItem = df.codItem;
      const catId = productoCategoriaMap.get(codItem);

      if (!catId || !categoriasValidas.has(catId) || (categoriaIdFiltro && catId != categoriaIdFiltro)) continue;

      const cantidadFacturada = toFloat(df.cantidad);
      if (cantidadFacturada === 0) continue;

      const current = resumen.get(catId) || {
        nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
        cantidadPedida: 0,
        cantidadFacturada: 0,
        leadTimes: [],
      };
      current.cantidadFacturada += cantidadFacturada;

      const fechaPedido = pedidoFechaMap.get(factura.nro_pedido);
      if (fechaPedido && factura.fecha_comp) {
        const dias = Math.max(0, Math.round((new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)));
        current.leadTimes.push(dias);
      }
      resumen.set(catId, current);
    }
  }

  return Array.from(resumen.entries())
    .filter(([_, data]) => data.cantidadPedida > 0 || data.cantidadFacturada > 0)
    .map(([catId, data]) => {
      const fillRate = data.cantidadPedida > 0
        ? toFixed(Math.min(data.cantidadFacturada / data.cantidadPedida, 1) * 100)
        : 0;

      const leadTimePromedio = data.leadTimes.length > 0
        ? toFixed(data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length)
        : null;

      return {
        categoriaId: catId,
        categoriaNombre: data.nombre,
        cantidadPedida: toFixed(data.cantidadPedida),
        cantidadFacturada: toFixed(data.cantidadFacturada),
        fillRate,
        leadTimePromedio,
      };
    })
    .sort((a, b) => a.categoriaNombre.localeCompare(b.categoriaNombre));
}

/**
 * 📈 Agrupa y procesa el detalle por pedido para una categoría específica.
 * @param {object} params - Parámetros con los datos filtrados.
 * @returns {Array<object>} Resumen por pedido para la categoría.
 */
export function generarDetallePorPedidoCategoria({ detallesPedidos, pedidosPorId, facturasCompletas, pedidoFechaMap }) {
  const agrupado = new Map();

  for (const dp of detallesPedidos) {
    const pedido = pedidosPorId.get(dp.pedidoDuxId);
    if (!pedido) continue;

    const current = agrupado.get(pedido.nro_pedido) || {
      nroPedido: pedido.nro_pedido,
      fecha: pedido.fecha,
      cantidadPedida: 0,
      cantidadFacturada: 0,
      leadTimeDias: null,
      productos: new Map(),
    };
    current.cantidadPedida += toFloat(dp.cantidad);

    const productoEnPedido = current.productos.get(dp.codItem) || {
      codItem: dp.codItem,
      descripcion: dp.descripcion,
      cantidadPedida: 0,
      cantidadFacturada: 0,
    };
    productoEnPedido.cantidadPedida += toFloat(dp.cantidad);
    current.productos.set(dp.codItem, productoEnPedido);

    agrupado.set(pedido.nro_pedido, current);
  }

  for (const factura of facturasCompletas) {
    const pedidoData = agrupado.get(factura.nro_pedido);
    if (!pedidoData) continue;

    for (const df of factura.detalles || []) {
      const productoEnPedido = pedidoData.productos.get(df.codItem);
      if (productoEnPedido) {
        pedidoData.cantidadFacturada += toFloat(df.cantidad);
        productoEnPedido.cantidadFacturada += toFloat(df.cantidad);

        if (factura.fecha_comp && pedidoData.fecha && pedidoData.leadTimeDias === null) {
          const diff = Math.max(
            0,
            Math.round((new Date(factura.fecha_comp) - new Date(pedidoData.fecha)) / (1000 * 60 * 60 * 24))
          );
          pedidoData.leadTimeDias = diff;
        }
      }
    }
    agrupado.set(factura.nro_pedido, pedidoData);
  }

  return Array.from(agrupado.values())
    .filter((p) => p.cantidadPedida > 0 || p.cantidadFacturada > 0)
    .map((p) => {
      const fillRate =
        p.cantidadPedida > 0
          ? toFixed(Math.min(p.cantidadFacturada / p.cantidadPedida, 1) * 100)
          : 0;

      const productosDetallados = Array.from(p.productos.values()).map(prod => ({
          codItem: prod.codItem,
          descripcion: prod.descripcion,
          cantidadPedida: toFixed(prod.cantidadPedida),
          cantidadFacturada: toFixed(prod.cantidadFacturada),
          fillRate: prod.cantidadPedida > 0 ? toFixed(Math.min(prod.cantidadFacturada / prod.cantidadPedida, 1) * 100) : 0,
      }));

      return {
        nroPedido: p.nroPedido,
        fechaPedido: formatFecha(p.fecha),
        cantidadPedida: toFixed(p.cantidadPedida),
        cantidadFacturada: toFixed(p.cantidadFacturada),
        fillRate,
        leadTimeDias: p.leadTimeDias,
        productos: productosDetallados,
      };
    })
    .sort((a,b) => dayjs(a.fechaPedido, "DD-MM-YYYY").diff(dayjs(b.fechaPedido, "DD-MM-YYYY")));
}

/* 🎯 FUNCIONES PRINCIPALES DE ORQUESTACIÓN DE DATOS */

/**
 * 🎯 Carga, filtra y pre-procesa todos los datos base para reportes de cliente.
 * @param {Date} desde - Fecha de inicio.
 * @param {Date} hasta - Fecha de fin.
 * @param {string} clienteFiltro - Filtro de cliente.
 * @returns {Promise<object | null>} Objeto con datos procesados o null si no hay datos.
 */
export async function cargarYProcesarDatosCliente(desde, hasta, clienteFiltro) {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const lowerCaseClienteFiltro = clienteFiltro?.toLowerCase();

  const facturasEnRango = await obtenerFacturasConDetallesEnRango(fechaDesde, fechaHasta);
  const nroPedidosDeFacturas = [...new Set(facturasEnRango.map(f => f.nro_pedido))];
  if (!nroPedidosDeFacturas.length) return null;

  const pedidos = await obtenerPedidosPorNro(nroPedidosDeFacturas);
  const pedidosFiltrados = pedidos.filter(p => p.cliente?.toLowerCase().includes(lowerCaseClienteFiltro));
  if (!pedidosFiltrados.length) return null;

  const pedidosPorId = new Map(pedidosFiltrados.map(p => [p.id, p]));
  const pedidosPorNro = new Map(pedidosFiltrados.map(p => [p.nro_pedido, p]));
  const pedidoFechaMap = new Map(pedidosFiltrados.map(p => [p.nro_pedido, p.fecha]));

  const detallesPedidos = await obtenerDetallesPedidosPorId([...pedidosPorId.keys()]);
  const detallesPedidosPorPedido = mapearDetallesPedidosPorPedido(detallesPedidos);
  const cantidadesPedidasPorItemEnPedido = mapearCantidadPedidaPorItemEnPedido(detallesPedidos);

  const allNroPedidosForFacturas = [...new Set(pedidosFiltrados.map(p => p.nro_pedido))];
  const facturasCompletas = facturasEnRango.filter(f => allNroPedidosForFacturas.includes(f.nro_pedido));

  const {
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaPrimeraFacturaPorItem,
  } = procesarFacturasParaMapeo(facturasCompletas);

  return {
    pedidos: pedidosFiltrados,
    pedidosPorId,
    pedidosPorNro,
    pedidoFechaMap,
    detallesPedidos,
    detallesPedidosPorPedido,
    cantidadesPedidasPorItemEnPedido,
    facturasCompletas,
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaPrimeraFacturaPorItem,
  };
}

/**
 * 🎯 Carga, filtra y pre-procesa todos los datos base para reportes de categoría.
 * @param {Date} fechaDesde - Fecha de inicio del rango.
 * @param {Date} fechaHasta - Fecha de fin del rango.
 * @param {number} [categoriaIdFiltro=null] - ID de categoría para filtrar.
 * @returns {Promise<object | null>} Objeto con datos procesados o null si no hay datos.
 */
export async function cargarYProcesarDatosCategoria(fechaDesde, fechaHasta, categoriaIdFiltro = null) {
    const categoriasDB = await obtenerCategoriasValidasDB();
    const productosDB = await Producto.findAll({ attributes: ['sku', 'categoriaId', 'nombre'] });
    const { categoriasValidas, categoriaNombreMap, productoCategoriaMap } = prepararMapeosCategoriasYProductos(categoriasDB, productosDB);

    let skusEnCategoriaFiltrada = new Set();
    if (categoriaIdFiltro) {
        if (!categoriasValidas.has(parseInt(categoriaIdFiltro))) {
            return {
                categoriasValidas,
                categoriaNombreMap,
                productoCategoriaMap,
                skusEnCategoriaFiltrada,
                pedidosPorId: new new Map(),
                pedidoFechaMap: new Map(),
                detallesPedidos: [],
                facturasCompletas: []
            };
        }
        for (const [sku, catId] of productoCategoriaMap.entries()) {
            if (catId == categoriaIdFiltro) {
                skusEnCategoriaFiltrada.add(sku);
            }
        }
        if (skusEnCategoriaFiltrada.size === 0) {
             return {
                categoriasValidas,
                categoriaNombreMap,
                productoCategoriaMap,
                skusEnCategoriaFiltrada,
                pedidosPorId: new Map(),
                pedidoFechaMap: new Map(),
                detallesPedidos: [],
                facturasCompletas: []
            };
        }
    } else {
        skusEnCategoriaFiltrada = new Set(productoCategoriaMap.keys());
    }

    const pedidos = await PedidoDux.findAll({
        where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
        attributes: ['id', 'nro_pedido', 'fecha'],
    });

    const pedidosPorId = new Map(pedidos.map(p => [p.id, p]));
    const pedidoFechaMap = new Map(pedidos.map(p => [p.nro_pedido, p.fecha]));
    const idPedidos = [...pedidosPorId.keys()];
    const nroPedidos = [...pedidoFechaMap.keys()];

    if (!idPedidos.length) return null;

    const detallesPedidos = await obtenerDetallesPedidosPorId(idPedidos);
    // Filtrar detallesPedidos por SKUs relevantes para la categoría
    const detallesPedidosFiltradosPorSku = detallesPedidos.filter(dp => skusEnCategoriaFiltrada.has(dp.codItem));

    const facturasCompletas = await obtenerFacturasConDetallesEnRango(fechaDesde, fechaHasta);
    // Filtrar facturas y sus detalles por SKUs relevantes y nro_pedido
    const facturasFiltradasPorSkuYPedido = facturasCompletas.filter(f => nroPedidos.includes(f.nro_pedido)).map(f => ({
        ...f.toJSON(), // Convertir a JSON para poder modificar detalles
        detalles: f.detalles ? f.detalles.filter(det => skusEnCategoriaFiltrada.has(det.codItem)) : []
    }));


    return {
        categoriasValidas,
        categoriaNombreMap,
        productoCategoriaMap,
        skusEnCategoriaFiltrada,
        pedidosPorId,
        pedidoFechaMap,
        detallesPedidos: detallesPedidosFiltradosPorSku, // Usar los detalles ya filtrados
        facturasCompletas: facturasFiltradasPorSkuYPedido, // Usar las facturas ya filtradas
        categoriaIdFiltro,
    };
}