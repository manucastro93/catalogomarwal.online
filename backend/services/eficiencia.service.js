// backend/services/eficiencia.service.js
import { Op } from 'sequelize';
import { PedidoDux, Factura, Producto } from '../models/index.js';
import {
  // 📦 Helpers
  toFloat,
  toFixed,

  // 🔍 DB Queries
  obtenerFacturasConDetallesEnRango,
  obtenerDetallesPedidosPorId,
  obtenerCategoriasValidasDB,

  // 🧱 Mapeos
  mapearDetallesPedidosPorPedido,
  mapearCantidadPedidaPorItemEnPedido,

  // 🧠 Procesamiento
  procesarFacturasParaMapeo,
  prepararMapeosCategoriasYProductos, // Agregado para cargarYProcesarDatosCategoria

  // 📈 Reportes
  generarReporteEvolucionMensual,
  generarReporteEficienciaPorProducto,
  generarDetalleProductoPorPedido,

  // 🎯 Cliente
  generarResumenEficienciaPorCliente,
  generarDetallePorPedido,
  // cargarYProcesarDatosCliente, // Esta función está definida aquí abajo

  // 🧠 Categoría
  generarResumenEficienciaPorCategoria,
  generarDetallePorPedidoCategoria,
  // cargarYProcesarDatosCategoria // Esta función está definida aquí abajo
} from '../utils/eficiencia/index.js';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// --- Funciones auxiliares para cargar y procesar datos ---
// Estas funciones se definen aquí y son exportadas si se necesitan en otros módulos.

/*** 🎯 Carga, filtra y pre-procesa todos los datos base para reportes de cliente.
 * @param {Date} desde - Fecha de inicio.
 * @param {Date} hasta - Fecha de fin.
 * @param {string} clienteFiltro - Filtro de cliente.
 * @returns {Promise<object | null>} Objeto con datos procesados o null si no hay datos.
 */
export async function cargarYProcesarDatosCliente(desde, hasta, clienteFiltro) {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const lowerCaseClienteFiltro = clienteFiltro?.toLowerCase();

  // 1. Obtener los pedidos cuya fecha de pedido cae dentro del rango de fechas.
  // Esto define el conjunto inicial de pedidos que potencialmente se analizarán.
  const pedidosEnRangoDeFechas = await PedidoDux.findAll({
    where: {
      fecha: { [Op.between]: [fechaDesde, fechaHasta] }
    },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente']
  });

  // 2. Aplicar el filtro de cliente a estos pedidos.
  let pedidosFiltrados = pedidosEnRangoDeFechas;
  if (lowerCaseClienteFiltro) {
    pedidosFiltrados = pedidosEnRangoDeFechas.filter(p => p.cliente?.toLowerCase().includes(lowerCaseClienteFiltro));
  } else {
  }

  // Si no hay pedidos después de los filtros, no hay datos que procesar.
  if (!pedidosFiltrados.length) {
    return null;
  }

  // 3. Crear mapeos básicos de pedidos para facilitar el acceso.
  const pedidosPorId = new Map(pedidosFiltrados.map(p => [p.id, p]));
  // Asegurarse de que nro_pedido se convierta a número para la clave del mapa, si es que no lo es ya.
  const pedidosPorNro = new Map(pedidosFiltrados.map(p => [Number(p.nro_pedido), p])); 
  const pedidoFechaMap = new Map(pedidosFiltrados.map(p => [Number(p.nro_pedido), p.fecha])); // Asegurarse de que la clave sea numérica

  // 4. Obtener los detalles de los pedidos filtrados.
  const detallesPedidos = await obtenerDetallesPedidosPorId([...pedidosPorId.keys()]);

  // 5. Crear mapeos de detalles de pedidos y cantidades pedidas.
  const detallesPedidosPorPedido = mapearDetallesPedidosPorPedido(detallesPedidos);
  const cantidadesPedidasPorItemEnPedido = mapearCantidadPedidaPorItemEnPedido(detallesPedidos);

  // 6. OBTENER TODAS LAS FACTURAS HISTÓRICAS DE LOS PEDIDOS FILTRADOS.
  // Este es el CAMBIO CRÍTICO para resolver la inconsistencia de cantidad facturada.
  // Se obtiene la lista de nro_pedido de los pedidos que pasaron todos los filtros.
  // Aseguramos que nro_pedido se convierta a número para la búsqueda.
  const nroPedidosParaFacturasHistoricas = [...new Set(pedidosFiltrados.map(p => Number(p.nro_pedido)))].filter(n => !isNaN(n));

  let facturasCompletas = [];
  if (nroPedidosParaFacturasHistoricas.length > 0) {
      // Llamamos a obtenerFacturasConDetallesEnRango pero le pasamos los nro_pedido
      // y null para las fechas, para que traiga TODAS las facturas de esos pedidos.
      facturasCompletas = await obtenerFacturasConDetallesEnRango(
          null, // Ignorar fecha de inicio
          null, // Ignorar fecha de fin
          nroPedidosParaFacturasHistoricas // <--- Pasar la lista de números de pedido a la función de DB
      );
  }

  // 7. Procesar las facturas completas para generar los mapeos finales.
  const {
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    ultimaFacturaPorPedido, // Obtener la última factura por pedido del procesamiento
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaUltimaFacturaPorItem, // Obtener la última fecha de factura por ítem
  } = procesarFacturasParaMapeo(facturasCompletas); 

  return {
    pedidos: pedidosFiltrados,
    pedidosPorId,
    pedidosPorNro,
    pedidoFechaMap,
    detallesPedidos,
    detallesPedidosPorPedido,
    cantidadesPedidasPorItemEnPedido,
    facturasCompletas, // Este contendrá el histórico completo de los pedidos filtrados
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    ultimaFacturaPorPedido, // Devolver también la última factura por pedido
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaUltimaFacturaPorItem, // Devolver la última fecha de factura por ítem
  };
}

/*** 🎯 Carga, filtra y pre-procesa todos los datos base para reportes de categoría.
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
                pedidosPorId: new Map(),
                pedidosPorNro: new Map(), // NUEVO: Asegurar que se inicializa y pasa pedidosPorNro
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
                pedidosPorNro: new Map(), // NUEVO: Asegurar que se inicializa y pasa pedidosPorNro
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
    // CONSTRUIR UN MAPA DE nro_pedido A OBJETO PEDIDO PARA FACILITAR LA BÚSQUEDA POR NÚMERO
    const pedidosPorNro = new Map(pedidos.map(p => [Number(p.nro_pedido), p])); // <-- IMPORTANTE: nro_pedido como clave numérica
    const pedidoFechaMap = new Map(pedidos.map(p => [Number(p.nro_pedido), p.fecha])); // Asegurarse de que la clave sea numérica

    const idPedidos = [...pedidosPorId.keys()];
    const nroPedidos = [...pedidosPorNro.keys()]; // Usar las claves numéricas de pedidosPorNro

    if (!idPedidos.length) return null;

    const detallesPedidos = await obtenerDetallesPedidosPorId(idPedidos);
    // Filtrar detallesPedidos por SKUs relevantes para la categoría
    const detallesPedidosFiltradosPorSku = detallesPedidos.filter(dp => skusEnCategoriaFiltrada.has(dp.codItem));

    // Obtener facturas completas para los nro_pedidos relevantes de forma histórica
    const facturasCompletasHistoricas = await obtenerFacturasConDetallesEnRango(null, null, nroPedidos);
    
    // Filtrar detalles de facturas por SKUs relevantes para la categoría
    const facturasFiltradasPorSkuYPedido = facturasCompletasHistoricas.map(f => ({
        ...f.toJSON(), // Convertir a JSON para poder modificar detalles
        detalles: f.detalles ? f.detalles.filter(det => skusEnCategoriaFiltrada.has(det.codItem)) : []
    }));

    return {
        categoriasValidas,
        categoriaNombreMap,
        productoCategoriaMap,
        skusEnCategoriaFiltrada,
        pedidosPorId,
        pedidosPorNro, // <--- PASAR ESTE MAPA COMPLETO
        pedidoFechaMap,
        detallesPedidos: detallesPedidosFiltradosPorSku,
        facturasCompletas: facturasFiltradasPorSkuYPedido,
        categoriaIdFiltro,
    };
}

// --- Generar Resumen Ejecutivo (GENERAL) ---
export const generarResumenEjecutivo = async (desde, hasta, comparar = true) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  
  const datos = await cargarYProcesarDatosCliente(fechaDesde, fechaHasta, null); 
  if (!datos) {
    return {
      totalPedidos: 0, totalFacturas: 0, fillRateGeneral: 0, leadTimePromedioDias: null,
      cantidadRetrasos: 0, porcentajePedidosAltosFillRate: 0, porcentajePedidosBajosFillRate: 0,
      variacionFillRate: 0, variacionLeadTime: 0, topClientesEficientes: [],
      topClientesIneficientes: [], topProductosProblema: [], categoriasCriticas: []
    };
  }

  const {
    pedidos,
    pedidosPorId,
    pedidosPorNro,
    detallesPedidos,
    detallesPedidosPorPedido,
    cantidadesPedidasPorItemEnPedido,
    facturasCompletas,
    detallesFacturasPorPedido,
    ultimaFacturaPorPedido, 
  } = datos;

  let totalCantidadPedidaGeneral = 0;
  let totalCantidadFacturadaGeneral = 0;
  let sumaLeadTimeGeneral = 0;
  let totalLeadTimeCalculado = 0;
  let pedidosConRetraso = 0;

  const fillRatesDePedidosUnicos = [];
  const eficienciaPorCliente = {}; 
  const sinFacturarPorProducto = {}; 

  // --- FILTRO CLAVE AQUÍ: Solo considerar pedidos con CANTIDAD FACTURADA > 0 para el resumen general ---
  const pedidosParaResumenGeneral = pedidos.filter(pedido => {
      const nroPedidoNum = Number(pedido.nro_pedido);
      const detallesF = detallesFacturasPorPedido.get(nroPedidoNum) || [];
      const cantidadFacturadaEstePedido = detallesF.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
      return cantidadFacturadaEstePedido > 0; // Solo incluye pedidos que tienen alguna cantidad facturada
  });

  // Iterar sobre los pedidos que tienen al menos un ítem facturado para calcular métricas generales
  for (const pedido of pedidosParaResumenGeneral) { // CAMBIO: Iterar sobre la lista filtrada
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const nroPedidoNum = Number(pedido.nro_pedido); 
    const detallesF = detallesFacturasPorPedido.get(nroPedidoNum) || []; // Sabemos que cantidadFacturadaEstePedido > 0
    const ultimaFactura = ultimaFacturaPorPedido.get(nroPedidoNum); 

    const cantidadPedidaTotalDelPedido = detallesP.reduce(
      (acc, d) => acc + toFloat(d.cantidad), 0
    );
    const cantidadFacturadaTotalDelPedido = detallesF.reduce(
      (acc, d) => acc + toFloat(d.cantidad), 0
    );

    const fillRateDePedido = cantidadPedidaTotalDelPedido > 0
      ? toFixed(Math.min(cantidadFacturadaTotalDelPedido / cantidadPedidaTotalDelPedido, 1) * 100)
      : 0;

    fillRatesDePedidosUnicos.push(fillRateDePedido);

    const nombreCliente = (pedido.cliente || '').trim();
    if (!eficienciaPorCliente[nombreCliente]) {
      eficienciaPorCliente[nombreCliente] = { pedidosCount: 0, totalFillRate: 0 };
    }
    eficienciaPorCliente[nombreCliente].pedidosCount++;
    eficienciaPorCliente[nombreCliente].totalFillRate += fillRateDePedido;

    // Calcular productos sin facturar (para estos pedidos ya facturados)
    for (const dp of detallesP) {
      const cantidadPedidaItem = toFloat(dp.cantidad);
      const claveItemPedido = `${nroPedidoNum}-${(dp.codItem || '').toString().trim().toUpperCase()}`; 
      const cantidadFacturadaItemTotal = detallesF
        .filter(df => df.codItem === dp.codItem)
        .reduce((acc, df) => acc + toFloat(df.cantidad), 0);

      const diferencia = Math.max(0, cantidadPedidaItem - cantidadFacturadaItemTotal);
      if (diferencia > 0) {
        const descripcionProducto = dp.descripcion || dp.codItem;
        if (!sinFacturarPorProducto[descripcionProducto]) {
          sinFacturarPorProducto[descripcionProducto] = 0;
        }
        sinFacturarPorProducto[descripcionProducto] += diferencia;
      }
    }

    // Calcular lead time general y retrasos
    if (ultimaFactura && pedido.fecha && ultimaFactura.fecha_comp) {
      const leadTime = Math.max(0, Math.round((new Date(ultimaFactura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
      sumaLeadTimeGeneral += leadTime;
      totalLeadTimeCalculado++;
      if (leadTime > 7) pedidosConRetraso++;
    }

    // Sumar cantidades pedidas y facturadas para el fillRateGeneral
    totalCantidadPedidaGeneral += cantidadPedidaTotalDelPedido;
    totalCantidadFacturadaGeneral += cantidadFacturadaTotalDelPedido;
  }

  const fillRateGeneral = totalCantidadPedidaGeneral > 0
    ? toFixed(Math.min(totalCantidadFacturadaGeneral / totalCantidadPedidaGeneral, 1) * 100)
    : 0;

  const leadTimePromedioDias = totalLeadTimeCalculado > 0
    ? toFixed(sumaLeadTimeGeneral / totalLeadTimeCalculado)
    : null;

  const porcentajeAltosFillRate = fillRatesDePedidosUnicos.length
    ? (fillRatesDePedidosUnicos.filter(f => f >= 95).length / fillRatesDePedidosUnicos.length) * 100
    : 0;

  const porcentajeBajosFillRate = fillRatesDePedidosUnicos.length
    ? (fillRatesDePedidosUnicos.filter(f => f < 80).length / fillRatesDePedidosUnicos.length) * 100
    : 0;

  const topClientesEficientes = Object.entries(eficienciaPorCliente)
    .map(([cliente, datos]) => ({
      cliente,
      fillRate: toFixed(datos.totalFillRate / datos.pedidosCount)
    }))
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, 5);

  const topClientesIneficientes = Object.entries(eficienciaPorCliente)
    .map(([cliente, datos]) => ({
      cliente,
      fillRate: toFixed(datos.totalFillRate / datos.pedidosCount)
    }))
    .sort((a, b) => a.fillRate - b.fillRate)
    .slice(0, 5);

  const topProductosProblema = Object.entries(sinFacturarPorProducto)
    .map(([producto, diferencia]) => ({ producto, sinFacturar: toFixed(diferencia) }))
    .sort((a, b) => b.sinFacturar - a.sinFacturar)
    .slice(0, 5);

  let variacionFillRate = 0;
  let variacionLeadTime = 0;

  if (comparar) {
    const diasRango = dayjs(fechaHasta).diff(dayjs(fechaDesde), 'days');
    const desdeAnterior = dayjs(fechaDesde).subtract(diasRango, 'days').toDate();
    const hastaAnterior = dayjs(fechaHasta).subtract(diasRango, 'days').toDate();

    const anterior = await generarResumenEjecutivo(
      dayjs(desdeAnterior).format("YYYY-MM-DD"),
      dayjs(hastaAnterior).format("YYYY-MM-DD"),
      false
    );

    variacionFillRate = anterior.fillRateGeneral > 0
      ? toFixed(((fillRateGeneral - anterior.fillRateGeneral) / anterior.fillRateGeneral) * 100, 1)
      : 0;

    variacionLeadTime = anterior.leadTimePromedioDias != null && leadTimePromedioDias != null
      ? toFixed(leadTimePromedioDias - anterior.leadTimePromedioDias)
      : 0;
  }

  return {
    totalPedidos: pedidosParaResumenGeneral.length, // CAMBIO: Usar la cantidad de pedidos que sí se facturaron
    totalFacturas: facturasCompletas.length, // Se refiere al total de facturas cargadas para análisis
    fillRateGeneral,
    leadTimePromedioDias,
    cantidadRetrasos: pedidosConRetraso,
    porcentajePedidosAltosFillRate: toFixed(porcentajeAltosFillRate, 1),
    porcentajePedidosBajosFillRate: toFixed(porcentajeBajosFillRate, 1),
    variacionFillRate,
    variacionLeadTime,
    topClientesEficientes,
    topClientesIneficientes,
    topProductosProblema,
    categoriasCriticas: []
  };
};

// --- Evolución Eficiencia Mensual (GENERAL) ---
export const obtenerEvolucionEficienciaMensualGeneral = async (desde, hasta, cliente) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const datos = await cargarYProcesarDatosCliente(fechaDesde, fechaHasta, cliente);
  if (!datos) return [];

  // CAMBIO: Pasar los nuevos mapas de datos al reporte, incluyendo detallesPedidosPorPedido
  const { facturasCompletas, pedidosPorNro, detallesPedidosPorPedido } = datos; 

  return generarReporteEvolucionMensual({
    facturas: facturasCompletas,
    pedidosPorNro,
    detallesPedidosPorPedido
  });
};


// --- Eficiencia por Cliente ---
export const obtenerEficienciaPorCliente = async (desde, hasta, cliente) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const datos = await cargarYProcesarDatosCliente(fechaDesde, fechaHasta, cliente);
  if (!datos) return [];
  // CAMBIO: Ahora obtenemos 'ultimaFacturaPorPedido' de 'datos'
  const { pedidos, detallesPedidosPorPedido, detallesFacturasPorPedido, ultimaFacturaPorPedido } = datos; 
  return generarResumenEficienciaPorCliente({
    pedidos,
    detallesPedidosPorPedido,
    detallesFacturasPorPedido,
    // primeraFacturaPorPedido, // Ya no se pasa si el Lead Time es con la última
    ultimaFacturaPorPedido // CAMBIO: Pasar la última factura
  });
};

// --- Detalle por Cliente ---
export const obtenerDetallePorCliente = async (desde, hasta, cliente) => {
  const datos = await cargarYProcesarDatosCliente(desde, hasta, cliente);
  if (!datos) return [];

  const {
    pedidos,
    detallesPedidosPorPedido,
    // primeraFacturaPorPedido, // YA NO SE USA
    ultimaFacturaPorPedido, // NUEVO: Obtener la última factura
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    // fechaPrimeraFacturaPorItem, // YA NO SE USA
    fechaUltimaFacturaPorItem, // NUEVO: Obtener la última fecha de factura por ítem
  } = datos;

  return pedidos.map(pedido => {
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const fechasFacturas = fechasFacturasArrayPorPedido.get(pedido.nro_pedido) || [];
    // const primeraFacturaPedido = primeraFacturaPorPedido.get(pedido.nro_pedido); // YA NO SE USA
    const ultimaFacturaPedidoIndividual = ultimaFacturaPorPedido.get(Number(pedido.nro_pedido)); // CAMBIO: Obtener la última factura, asegurando que la clave sea numérica

    const detalle = generarDetallePorPedido({
      pedido,
      detallesPedido: detallesP,
      fechasFacturasArray: fechasFacturas,
      // primeraFacturaPedido, // YA NO SE USA
      ultimaFacturaPedido: ultimaFacturaPedidoIndividual, // CAMBIO: Pasar la última factura
      cantidadesFacturadasPorItemEnPedido,
      valorFacturadoPorItemEnPedido,
      // fechaPrimeraFacturaPorItem, // YA NO SE USA
      fechaUltimaFacturaPorItem, // CAMBIO: Pasar la última fecha de factura por ítem
    });

    return {
      ...detalle,
      pedidoId: pedido.id,
    };
  });
};


// --- Detalle por Pedido (obtener un pedido específico) ---
export const obtenerDetallePorPedido = async (pedidoId) => {
  const pedido = await PedidoDux.findByPk(pedidoId);
  if (!pedido) return null;
  const detallesPedido = await obtenerDetallesPedidosPorId([pedidoId]);

  // Obtener TODAS las facturas históricas para este pedido específico
  const facturasFiltradasPorPedido = await obtenerFacturasConDetallesEnRango(null, null, Number(pedido.nro_pedido)); // CAMBIO: Asegurar que nro_pedido sea número

  const {
    // primeraFacturaPorPedido, // YA NO SE USA
    ultimaFacturaPorPedido, // NUEVO: Obtener la última factura por pedido
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    // fechaPrimeraFacturaPorItem, // YA NO SE USA
    fechaUltimaFacturaPorItem, // NUEVO: Obtener la última fecha de factura por ítem
  } = procesarFacturasParaMapeo(facturasFiltradasPorPedido);

  const fechasFacturas = fechasFacturasArrayPorPedido.get(Number(pedido.nro_pedido)) || []; // CAMBIO: Asegurar que nro_pedido sea número
  // const primeraFacturaPedido = primeraFacturaPorPedido.get(pedido.nro_pedido); // YA NO SE USA
  const ultimaFacturaPedidoIndividual = ultimaFacturaPorPedido.get(Number(pedido.nro_pedido)); // CAMBIO: Obtener la última factura, asegurando que la clave sea numérica

  return generarDetallePorPedido({
    pedido,
    detallesPedido,
    fechasFacturasArray: fechasFacturas,
    // primeraFacturaPedido, // YA NO SE USA
    ultimaFacturaPedido: ultimaFacturaPedidoIndividual, // CAMBIO: Pasar la última factura
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    // fechaPrimeraFacturaPorItem, // YA NO SE USA
    fechaUltimaFacturaPorItem, // CAMBIO: Pasar la última fecha de factura por ítem
  });
  
};

// --- Eficiencia por Producto ---
export const obtenerEficienciaPorProducto = async (desde, hasta, filtro) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const datos = await cargarYProcesarDatosCliente(fechaDesde, fechaHasta, null);
  if (!datos) return [];

  const { pedidos, detallesPedidos, facturasCompletas, pedidoFechaMap } = datos;

  return generarReporteEficienciaPorProducto(
    detallesPedidos,
    facturasCompletas,
    pedidos,
    filtro
  );
};

// --- Detalle por Producto ---
export const obtenerDetallePorProducto = async (desde, hasta, productoSku) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const datos = await cargarYProcesarDatosCliente(fechaDesde, fechaHasta, null);
  if (!datos) return [];

  return generarDetalleProductoPorPedido(productoSku, datos);
};

// --- Eficiencia por Categoría ---
export const obtenerEficienciaPorCategoria = async (desde, hasta, categoriaId) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const datos = await cargarYProcesarDatosCategoria(fechaDesde, fechaHasta, categoriaId);
  if (!datos) return [];

  const {
    categoriasValidas,
    categoriaNombreMap,
    productoCategoriaMap,
    pedidoFechaMap,
    detallesPedidos,
    facturasCompletas,
    categoriaIdFiltro,
    pedidosPorId,
    pedidosPorNro
  } = datos;

  return generarResumenEficienciaPorCategoria({
    categoriaIdFiltro,
    categoriasValidas,
    categoriaNombreMap,
    productoCategoriaMap,
    pedidoFechaMap,
    detallesPedidos,
    facturasCompletas,
    pedidosPorId,
    pedidosPorNro // <--- PASAR A LA FUNCIÓN GENERADORA
  });
};

// --- Detalle por Categoría ---
export const obtenerDetallePorCategoria = async (desde, hasta, categoriaId) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const datos = await cargarYProcesarDatosCategoria(fechaDesde, fechaHasta, categoriaId);
  if (!datos) return [];

  const {
    detallesPedidos,
    pedidosPorId,
    pedidosPorNro,
    facturasCompletas,
    pedidoFechaMap,
  } = datos;

  // Asumiendo que generarDetallePorPedidoCategoria puede necesitar pedidosPorNro
  // para sus cálculos internos, especialmente si debe relacionar facturas con pedidos
  // y obtener fechas o IDs de pedidos de forma eficiente.
  return generarDetallePorPedidoCategoria({
    detallesPedidos,
    pedidosPorId,
    pedidosPorNro,
    facturasCompletas,
    pedidoFechaMap,
  });
};

// --- Eficiencia por Pedido ---
export const obtenerEficienciaPorPedido = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  // 1. Buscar pedidos en rango
  const pedidos = await PedidoDux.findAll({
    where: {
      fecha: { [Op.between]: [fechaDesde, fechaHasta] }
    },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente']
  });

  const idPedidos = pedidos.map(p => p.id);
  const nroPedidos = pedidos.map(p => Number(p.nro_pedido)).filter(n => !isNaN(n)); // CAMBIO: Asegurar nro_pedido sea numérico

  // 2. Buscar detalles de pedidos
  const detallesPedidosDB = await obtenerDetallesPedidosPorId(idPedidos);
  const detallesPedidosPorPedido = mapearDetallesPedidosPorPedido(detallesPedidosDB);

  // 3. Buscar facturas solo para esos pedidos, incluyendo detalles (históricas)
  const facturasFiltradasPorNroPedido = await obtenerFacturasConDetallesEnRango(
    null, // Ignorar fecha de inicio
    null, // Ignorar fecha de fin
    nroPedidos // <--- Pasar la lista de números de pedido a la función de DB
  );

  // 4. Procesar las facturas
  const {
    detallesFacturasPorPedido,
    // primeraFacturaPorPedido, // YA NO SE USA
    ultimaFacturaPorPedido, // NUEVO: Obtener la última factura por pedido
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    // fechaPrimeraFacturaPorItem, // YA NO SE USA
    fechaUltimaFacturaPorItem, // NUEVO: Obtener la última fecha de factura por ítem
  } = procesarFacturasParaMapeo(facturasFiltradasPorNroPedido);

  // 5. Armar resultado final
  const resultado = pedidos.map(pedido => {
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const fechasFacturas = fechasFacturasArrayPorPedido.get(Number(pedido.nro_pedido)) || []; // CAMBIO: Asegurar nro_pedido sea numérico
    // const primeraFactura = primeraFacturaPorPedido.get(pedido.nro_pedido); // YA NO SE USA
    const ultimaFactura = ultimaFacturaPorPedido.get(Number(pedido.nro_pedido)); // CAMBIO: Obtener la última factura, asegurando que la clave sea numérica

    return generarDetallePorPedido({
      pedido,
      detallesPedido: detallesP,
      fechasFacturasArray: fechasFacturas,
      // primeraFacturaPedido: primeraFactura, // YA NO SE USA
      ultimaFacturaPedido: ultimaFactura, // CAMBIO: Pasar la última factura
      cantidadesFacturadasPorItemEnPedido,
      valorFacturadoPorItemEnPedido,
      // fechaPrimeraFacturaPorItem, // YA NO SE USA
      fechaUltimaFacturaPorItem, // CAMBIO: Pasar la última fecha de factura por ítem
    });
  });

  return resultado;
};

// --- Buscar Clientes desde Facturas ---
export const buscarClientesDesdeFacturas = async (texto = "", limit = 10000) => {
  const textoLower = texto.toLowerCase();

  const facturas = await Factura.findAll({
    where: {
      anulada_boolean: false,
      apellido_razon_soc: {
        [Op.like]: `%${textoLower}%`,
      },
    },
    include: [{
      model: PedidoDux,
      as: "pedidoDux",
      attributes: ["cliente"]
    }],
    attributes: ["apellido_razon_soc"],
    limit,
  });
  
  const nombres = facturas.map(f => ({
    nombre: f.pedidoDux?.cliente ?? "",
    razon_social: f.apellido_razon_soc
  }));

  const unicos = Array.from(new Map(nombres.map(n => [n.nombre, n])).values());
  return unicos;
};