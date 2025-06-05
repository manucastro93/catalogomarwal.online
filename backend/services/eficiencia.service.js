import { Op, fn, col, where } from 'sequelize';
import { PedidoDux, DetallePedidoDux, Factura, DetalleFactura, Cliente, Producto, Categoria } from '../models/index.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(utc);
dayjs.extend(customParseFormat);
// --- Helper para formatear fechas consistentemente ---
const formatFecha = (date) => {
  if (!date) return 'Sin Fecha';
  return dayjs(date).utc().format("DD-MM-YYYY");
};

// --- Generar Resumen Ejecutivo (GENERAL) ---
export const generarResumenEjecutivo = async (desde, hasta, comparar = true) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const facturasEnRangoConDetalles = await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['nro_pedido', 'fecha_comp', 'apellido_razon_soc'],
    include: [{
      model: DetalleFactura,
      as: 'detalles',
      attributes: ['id', 'codItem', 'cantidad', 'descripcion']
    }]
  });

  if (facturasEnRangoConDetalles.length === 0) {
    return {
      totalPedidos: 0, totalFacturas: 0, fillRateGeneral: 0, leadTimePromedioDias: null,
      cantidadRetrasos: 0, porcentajePedidosAltosFillRate: 0, porcentajePedidosBajosFillRate: 0,
      variacionFillRate: 0, variacionLeadTime: 0, topClientesEficientes: [],
      topClientesIneficientes: [], topProductosProblema: [], categoriasCriticas: []
    };
  }

  const nroPedidosUnicosConFacturasEnRango = [...new Set(facturasEnRangoConDetalles.map(f => f.nro_pedido))];

  const pedidosAsociados = await PedidoDux.findAll({
    where: { nro_pedido: { [Op.in]: nroPedidosUnicosConFacturasEnRango } },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente'],
  });


  const pedidosPorId = new Map(pedidosAsociados.map(p => [p.id, p]));
  const pedidosPorNro = new Map(pedidosAsociados.map(p => [p.nro_pedido, p]));

  const allDetallesPedidos = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: pedidosAsociados.map(p => p.id) } },
    attributes: ['id', 'pedidoDuxId', 'codItem', 'cantidad', 'descripcion']
  });

  const detallesPedidosPorPedidoId = new Map();
  for (const dp of allDetallesPedidos) {
    if (!detallesPedidosPorPedidoId.has(dp.pedidoDuxId)) {
      detallesPedidosPorPedidoId.set(dp.pedidoDuxId, []);
    }
    detallesPedidosPorPedidoId.get(dp.pedidoDuxId).push(dp);
  }

  const cantidadesPedidasOriginalesPorItemEnPedido = new Map();
  for (const dp of allDetallesPedidos) {
    const clave = `${dp.pedidoDuxId}-${dp.codItem}`;
    cantidadesPedidasOriginalesPorItemEnPedido.set(clave, (cantidadesPedidasOriginalesPorItemEnPedido.get(clave) || 0) + parseFloat(dp.cantidad || 0));
  }

  const todasLasFacturasDePedidosAsociados = await Factura.findAll({
    where: {
      nro_pedido: { [Op.in]: pedidosAsociados.map(p => p.nro_pedido) },
      anulada_boolean: false
    },
    attributes: ['nro_pedido'],
    include: [{
      model: DetalleFactura,
      as: 'detalles',
      attributes: ['cantidad', 'codItem']
    }]
  });

  const detallesFacturasTotalesPorPedido = new Map();
  for (const factura of todasLasFacturasDePedidosAsociados) {
    if (factura.detalles && Array.isArray(factura.detalles)) {
      if (!detallesFacturasTotalesPorPedido.has(factura.nro_pedido)) {
        detallesFacturasTotalesPorPedido.set(factura.nro_pedido, []);
      }
      factura.detalles.forEach(df => {
        detallesFacturasTotalesPorPedido.get(factura.nro_pedido).push(df);
      });
    }
  }

  let totalCantidadPedidaGeneral = 0;
  let totalCantidadFacturadaGeneral = 0;
  let sumaLeadTimeGeneral = 0;
  let totalLeadTimeCalculado = 0;
  let pedidosConRetraso = 0;
  
  const fillRatesDePedidosUnicos = []; 
  const eficienciaPorCliente = {};
  const sinFacturarPorProducto = {};
  
  const pedidosCompletosProcesadosParaMétricasPorPedido = new Set(); // Este Set contará los pedidos que realmente se procesan.
  const itemsPedidosContabilizadosParaCantidadPedidaGeneral = new Set();

  for (const facturaEnRango of facturasEnRangoConDetalles) {
      if (!Array.isArray(facturaEnRango.detalles) || !facturaEnRango.fecha_comp) continue;

      const pedido = pedidosPorNro.get(facturaEnRango.nro_pedido);
      if (!pedido || !pedido.id || !pedido.fecha) continue;

      // El Lead Time se calcula y se suma por cada DOCUMENTO de factura en el rango
      const leadTime = Math.max(0, Math.round((new Date(facturaEnRango.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
      sumaLeadTimeGeneral += leadTime;
      totalLeadTimeCalculado++;
      if (leadTime > 7) pedidosConRetraso++;

      // ✅ Contamos el pedido aquí si es la primera vez que lo vemos en este Set
      if (!pedidosCompletosProcesadosParaMétricasPorPedido.has(pedido.id)) {
          pedidosCompletosProcesadosParaMétricasPorPedido.add(pedido.id); // Registrar que este pedido ya fue procesado para las métricas por pedido

          // Calcular Fill Rate de este pedido completo (no solo de esta factura en rango)
          const detallesPDelPedidoCompleto = detallesPedidosPorPedidoId.get(pedido.id) || [];
          const cantidadPedidaTotalDelPedido = detallesPDelPedidoCompleto.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
          
          const detallesFacturasDelPedidoCompleto = detallesFacturasTotalesPorPedido.get(pedido.nro_pedido) || [];
          const cantidadFacturadaTotalDelPedido = detallesFacturasDelPedidoCompleto.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

          const fillRateDePedido = cantidadPedidaTotalDelPedido > 0
              ? +(Math.min(cantidadFacturadaTotalDelPedido / cantidadPedidaTotalDelPedido, 1) * 100).toFixed(2)
              : 0;
          
          fillRatesDePedidosUnicos.push(fillRateDePedido);

          // Eficiencia por Cliente
          const nombreCliente = (pedido.cliente || '').trim();
          if (!eficienciaPorCliente[nombreCliente]) {
              eficienciaPorCliente[nombreCliente] = { pedidosCount: 0, totalFillRate: 0 };
          }
          eficienciaPorCliente[nombreCliente].pedidosCount++;
          eficienciaPorCliente[nombreCliente].totalFillRate += fillRateDePedido;

          // Productos Problema (se calcula para el pedido completo, una sola vez)
          for (const dp of detallesPDelPedidoCompleto) {
              const cantidadPedidaItem = parseFloat(dp.cantidad || 0);
              const cantidadFacturadaItemTotal = detallesFacturasDelPedidoCompleto
                  .filter(df => df.codItem === dp.codItem)
                  .reduce((acc, df) => acc + parseFloat(df.cantidad || 0), 0);
              
              const diferencia = Math.max(0, cantidadPedidaItem - cantidadFacturadaItemTotal);
              if (diferencia > 0) {
                  const descripcionProducto = dp.descripcion || dp.codItem;
                  if (!sinFacturarPorProducto[descripcionProducto]) sinFacturarPorProducto[descripcionProducto] = 0;
                  sinFacturarPorProducto[descripcionProducto] += diferencia;
              }
          }
      }

      // Acumular cantidades para el FILL RATE GENERAL (sumando por cada DETALLE DE FACTURA en el rango)
      for (const df of facturaEnRango.detalles) {
          totalCantidadFacturadaGeneral += parseFloat(df.cantidad || 0);

          const claveItemPedido = `${pedido.id}-${df.codItem}`;
          if (!itemsPedidosContabilizadosParaCantidadPedidaGeneral.has(claveItemPedido)) {
              const cantidadPedidaOriginalItem = cantidadesPedidasOriginalesPorItemEnPedido.get(claveItemPedido) || 0;
              totalCantidadPedidaGeneral += cantidadPedidaOriginalItem;
              itemsPedidosContabilizadosParaCantidadPedidaGeneral.add(claveItemPedido);
          }
      }
  }

  const fillRateGeneral = totalCantidadPedidaGeneral > 0
    ? +(Math.min(totalCantidadFacturadaGeneral / totalCantidadPedidaGeneral, 1) * 100).toFixed(2)
    : 0;

  const leadTimePromedioDias = totalLeadTimeCalculado > 0
    ? +(sumaLeadTimeGeneral / totalLeadTimeCalculado).toFixed(2)
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
      fillRate: +(datos.totalFillRate / datos.pedidosCount).toFixed(2)
    }))
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, 5);

  const topClientesIneficientes = Object.entries(eficienciaPorCliente)
    .map(([cliente, datos]) => ({
      cliente,
      fillRate: +(datos.totalFillRate / datos.pedidosCount).toFixed(2)
    }))
    .sort((a, b) => a.fillRate - b.fillRate)
    .slice(0, 5);

  const topProductosProblema = Object.entries(sinFacturarPorProducto)
    .map(([producto, diferencia]) => ({ producto, sinFacturar: +diferencia.toFixed(2) }))
    .sort((a, b) => b.sinFacturar - a.sinFacturar)
    .slice(0, 5);

  let variacionFillRate = 0;
  let variacionLeadTime = 0;

  if (comparar) {
    const diasRango = Math.ceil((fechaHasta.getTime() - fechaDesde.getTime()) / (1000 * 60 * 60 * 24));
    
    const fechaDesdeAnterior = new Date(fechaDesde);
    fechaDesdeAnterior.setDate(fechaDesdeAnterior.getDate() - diasRango);
    const fechaHastaAnterior = new Date(fechaHasta);
    fechaHastaAnterior.setDate(fechaHastaAnterior.getDate() - diasRango);

    const anterior = await generarResumenEjecutivo(
      dayjs(fechaDesdeAnterior).format("YYYY-MM-DD"),
      dayjs(fechaHastaAnterior).format("YYYY-MM-DD"),
      false
    );

    variacionFillRate = anterior.fillRateGeneral > 0
      ? +((fillRateGeneral - anterior.fillRateGeneral) / anterior.fillRateGeneral * 100).toFixed(1)
      : 0;

    variacionLeadTime = anterior.leadTimePromedioDias != null && leadTimePromedioDias != null
      ? +(leadTimePromedioDias - anterior.leadTimePromedioDias).toFixed(2)
      : 0;
  }

  return {
    // ✅ CORRECCIÓN FINAL: totalPedidos cuenta los pedidos que fueron REALMENTE procesados en el bucle principal.
    totalPedidos: pedidosCompletosProcesadosParaMétricasPorPedido.size, 
    totalFacturas: facturasEnRangoConDetalles.length, // Sigue contando documentos de factura
    fillRateGeneral,
    leadTimePromedioDias,
    cantidadRetrasos: pedidosConRetraso,
    porcentajePedidosAltosFillRate: +porcentajeAltosFillRate.toFixed(1),
    porcentajePedidosBajosFillRate: +porcentajeBajosFillRate.toFixed(1),
    variacionFillRate,
    variacionLeadTime,
    topClientesEficientes,
    topClientesIneficientes,
    topProductosProblema,
    categoriasCriticas: []
  };
};
// --- Evolución del Lead Time (por fecha de factura) ---
export const obtenerEvolucionLeadTime = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener todas las facturas en el rango de fecha_comp
  const facturas = await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['nro_pedido', 'fecha_comp'],
  });

  const nroPedidosConFacturas = facturas.map(f => f.nro_pedido);

  // 2. Obtener los pedidos correspondientes a esas facturas (sin filtro de fecha de pedido)
  const pedidosAsociados = await PedidoDux.findAll({
    where: {
      nro_pedido: { [Op.in]: nroPedidosConFacturas }
    },
    attributes: ['nro_pedido', 'fecha'],
  });

  const pedidosMap = new Map(pedidosAsociados.map(p => [p.nro_pedido, p]));

  const porFecha = {}; // Acumulador por fecha de factura

  for (const factura of facturas) {
    const fechaStr = dayjs(factura.fecha_comp).format("YYYY-MM-DD");
    const pedido = pedidosMap.get(factura.nro_pedido);

    if (!pedido) {
        continue;
    }

    const dias = Math.max(0, Math.round((new Date(factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));

    if (!porFecha[fechaStr]) {
      porFecha[fechaStr] = { totalLeadTime: 0, count: 0 };
    }

    porFecha[fechaStr].totalLeadTime += dias;
    porFecha[fechaStr].count += 1;
  }

  const resultado = Object.entries(porFecha).map(([fecha, valores]) => ({
    fecha,
    leadTime: +(valores.totalLeadTime / valores.count).toFixed(2)
  }));

  return resultado;
};

// --- Evolución del Fill Rate (por fecha de factura) ---
export const obtenerEvolucionFillRate = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener todas las facturas en el rango de fecha_comp, incluyendo sus detalles
  const facturasConDetalles = await Factura.findAll({
      where: {
          fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ['nro_pedido', 'fecha_comp'],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          attributes: ['codItem', 'cantidad']
      }]
  });

  const nroPedidosDeFacturas = facturasConDetalles.map(f => f.nro_pedido);

  // 2. Obtener los detalles de los pedidos correspondientes a esas facturas
  // No filtramos por fecha de pedido aquí, ya que el pedido puede ser anterior.
  const detallesPedidosAsociados = await DetallePedidoDux.findAll({
      include: [{
          model: PedidoDux,
          as: 'pedidoDux',
          where: {
              nro_pedido: { [Op.in]: nroPedidosDeFacturas }
          },
          attributes: ['id', 'nro_pedido', 'fecha'] // Necesitamos id y nro_pedido para mapear
      }],
      attributes: ['pedidoDuxId', 'codItem', 'cantidad']
  });

  // Mapeo de cantidades pedidas por (pedidoId-codItem)
  const cantidadesPedidasPorItem = new Map(); // Key: `${pedidoId}-${codItem}`, Value: cantidad
  for (const dp of detallesPedidosAsociados) {
      if (dp.pedidoDuxId && dp.codItem) {
          const key = `${dp.pedidoDuxId}-${dp.codItem}`;
          cantidadesPedidasPorItem.set(key, (cantidadesPedidasPorItem.get(key) || 0) + parseFloat(dp.cantidad || 0));
      }
  }

  const dataPorFecha = {}; // Key: YYYY-MM-DD, Value: { pedida: sum, facturada: sum }

  for (const factura of facturasConDetalles) {
      const fechaStr = dayjs(factura.fecha_comp).format("YYYY-MM-DD");
      if (!dataPorFecha[fechaStr]) {
          dataPorFecha[fechaStr] = { pedida: 0, facturada: 0, itemsProcesados: new Set() }; // Usamos un Set para no duplicar 'pedida' por item
      }

      const pedidoDux = await PedidoDux.findOne({ // Se busca el pedidoDux para obtener el id
          where: { nro_pedido: factura.nro_pedido },
          attributes: ['id']
      });
      if (!pedidoDux) continue;

      if (Array.isArray(factura.detalles)) {
          for (const df of factura.detalles) {
              const keyItem = `${pedidoDux.id}-${df.codItem}`;
              const cantidadPedidaOriginal = cantidadesPedidasPorItem.get(keyItem) || 0;

              // Solo sumar la cantidad pedida original una vez por item de pedido para esa fecha
              if (!dataPorFecha[fechaStr].itemsProcesados.has(keyItem)) {
                  dataPorFecha[fechaStr].pedida += cantidadPedidaOriginal;
                  dataPorFecha[fechaStr].itemsProcesados.add(keyItem);
              }
              
              dataPorFecha[fechaStr].facturada += parseFloat(df.cantidad || 0);
          }
      }
  }

  const fechas = Object.keys(dataPorFecha).sort();

  const resultado = fechas.map((fecha) => {
    const pedida = dataPorFecha[fecha].pedida || 0;
    const facturada = dataPorFecha[fecha].facturada || 0;
    const porcentaje = pedida > 0 ? +(Math.min(facturada / pedida, 1) * 100).toFixed(2) : 0;
    return { fecha, fillRate: porcentaje };
  });

  return resultado;
};

// --- Outliers de Fill Rate (Productos con bajo fill rate) ---
export const obtenerOutliersFillRate = async (desde, hasta, filtroProducto) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener pedidos en el rango de fecha de pedido
  const pedidosEnRango = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ['id', 'nro_pedido', 'fecha'] // Necesitamos fecha para lead time
  });
  const idPedidosEnRango = pedidosEnRango.map(p => p.id);
  const nroPedidosEnRango = pedidosEnRango.map(p => p.nro_pedido);
  const pedidoFechaMap = new Map(pedidosEnRango.map(p => [p.nro_pedido, p.fecha]));


  // 2. Obtener DetallePedidos asociados a los pedidos en rango
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidosEnRango } },
    attributes: ['codItem', 'descripcion', 'cantidad']
  });

  // 3. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosEnRango },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp"],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          attributes: ["codItem", "cantidad", "descripcion"] // Añadir descripción
      }]
  });


  const pedidasPorProducto = {}; // key: codItem, value: { producto: desc, pedida: sum }
  const facturadasPorProducto = {}; // key: codItem, value: { producto: desc, facturada: sum, leadTimes: [] }

  for (const dp of detallesPedidosDB) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!filtroProducto || key.toLowerCase().includes(filtroProducto) || desc.toLowerCase().includes(filtroProducto)) {
      if (!pedidasPorProducto[key]) pedidasPorProducto[key] = { producto: desc, pedida: 0 };
      pedidasPorProducto[key].pedida += parseFloat(dp.cantidad || 0);
    }
  }

  for (const factura of facturasAsociadas) {
      if (!Array.isArray(factura.detalles)) continue;
      for (const df of factura.detalles) {
          const key = df.codItem;
          // Usamos la descripción del lado de los pedidos si existe, sino la del detalle de factura, sino el codItem
          const desc = (pedidasPorProducto[key] && pedidasPorProducto[key].producto) || df.descripcion || key; 
          
          if (!filtroProducto || key.toLowerCase().includes(filtroProducto) || desc.toLowerCase().includes(filtroProducto)) {
              if (!facturadasPorProducto[key]) facturadasPorProducto[key] = { producto: desc, facturada: 0, leadTimes: [] };
              facturadasPorProducto[key].facturada += parseFloat(df.cantidad || 0);

              // Calcular lead time
              const fechaPedido = pedidoFechaMap.get(factura.nro_pedido);
              if (fechaPedido) {
                  const diff = Math.max(0, Math.round(
                      (new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)
                  ));
                  facturadasPorProducto[key].leadTimes.push(diff);
              }
          }
      }
  }

  const outliers = [];
  // Iteramos sobre los productos que tuvieron pedidos en el rango
  for (const key in pedidasPorProducto) {
    const pedidaData = pedidasPorProducto[key];
    const facturadaData = facturadasPorProducto[key] || { facturada: 0, leadTimes: [] };

    const pedidas = pedidaData.pedida;
    const facturadas = facturadaData.facturada;
    const leadTimes = facturadaData.leadTimes;

    const fillRate = pedidas > 0 ? +(Math.min(facturadas / pedidas, 1) * 100).toFixed(2) : 0;
    const leadTimePromedio = leadTimes.length > 0
      ? +(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(2)
      : null;

    outliers.push({
      codItem: key,
      descripcion: pedidaData.producto, // Usamos la descripción del lado del pedido
      pedidas: +pedidas.toFixed(2),
      facturadas: +facturadas.toFixed(2),
      fillRate,
      leadTimePromedio // Incluimos lead time promedio para contexto
    });
  }

  // Si hay productos que solo tienen facturas pero no pedidos en el rango, no se incluyen en "outliers"
  // ya que esta función se enfoca en "fill rate", que requiere un "pedido".

  outliers.sort((a, b) => a.fillRate - b.fillRate); // Peor fill rate primero
  return outliers.slice(0, 20); // Top 20 peores
};

// --- Evolución Eficiencia Mensual (GENERAL) ---
export const obtenerEvolucionEficienciaMensualGeneral = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const pedidos = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ["id", "fecha", "nro_pedido"],
  });

  const pedidosPorNro = new Map(pedidos.map(p => [p.nro_pedido, p]));
  const idPedidos = pedidos.map(p => p.id);

  const facturasEnRangoConDetalles = await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [fechaDesde, hasta] }, // <<< Nota: 'hasta' debe ser fechaHasta
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ["nro_pedido", "fecha_comp"],
    include: [{
      model: DetalleFactura,
      as: 'detalles', // ✅ Alias correcto
      attributes: ['codItem', 'cantidad']
    }]
  });

  const cantidadesPedidasOriginalesPorItemEnPedido = new Map();
  const allDetallesPedidos = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidos } },
    attributes: ['pedidoDuxId', 'codItem', 'cantidad']
  });
  for (const dp of allDetallesPedidos) {
    const clave = `${dp.pedidoDuxId}-${dp.codItem}`;
    cantidadesPedidasOriginalesPorItemEnPedido.set(clave, (cantidadesPedidasOriginalesPorItemEnPedido.get(clave) || 0) + parseFloat(dp.cantidad || 0));
  }

  const dataPorMesFinal = {};
  const consumidosPorItemEnPedido = new Map(); // Variable para controlar el consumo de items para el fillrate mensual

  // --- BUCLE PRINCIPAL: Iterar sobre CADA DOCUMENTO DE FACTURA en el rango ---
  for (const factura of facturasEnRangoConDetalles) { // Ahora 'factura' representa un documento de factura
      if (!Array.isArray(factura.detalles) || !factura.fecha_comp) continue;

      const pedido = pedidosPorNro.get(factura.nro_pedido);
      if (!pedido || !pedido.id || !pedido.fecha) continue;

      const fechaFactura = new Date(factura.fecha_comp);
      const mes = dayjs(fechaFactura).format("YYYY-MM");

      dataPorMesFinal[mes] = dataPorMesFinal[mes] || {
        pedida: 0,
        facturada: 0,
        totalLeadTime: 0,
        countLeadTime: 0,
        itemsPedidosProcesadosEnMes: new Set(), // Para sumar 'pedida' una vez por item de pedido por mes
        facturasProcesadasParaLeadTime: new Set() // Para contar Lead Time una vez por documento de factura por mes
      };

      // ✅ CÁLCULO DEL LEAD TIME: Una vez por DOCUMENTO DE FACTURA
      if (!dataPorMesFinal[mes].facturasProcesadasParaLeadTime.has(factura.nro_pedido)) {
          const fechaPedido = new Date(pedido.fecha);
          const dias = Math.max(0, Math.round((fechaFactura - fechaPedido) / (1000 * 60 * 60 * 24)));
          dataPorMesFinal[mes].totalLeadTime += dias;
          dataPorMesFinal[mes].countLeadTime += 1;
          dataPorMesFinal[mes].facturasProcesadasParaLeadTime.add(factura.nro_pedido);
      }

      // --- ACUMULACIÓN DE CANTIDADES (por cada DETALLE de factura) ---
      for (const df of factura.detalles) { // Aquí sí se itera por detalle para las cantidades
          // LÍNEA QUE CAUSABA EL ERROR ELIMINADA: totalCantidadFacturadaGeneral += parseFloat(df.cantidad || 0);

          const claveItemPedido = `${pedido.id}-${df.codItem}`;
          const cantidadPedidaOriginal = cantidadesPedidasOriginalesPorItemEnPedido.get(claveItemPedido) || 0;
          const cantidadFacturadaActual = parseFloat(df.cantidad || "0"); // Asegurar que es string si puede ser null

          const yaConsumido = consumidosPorItemEnPedido.get(claveItemPedido) || 0;
          const restanteParaFacturar = Math.max(0, cantidadPedidaOriginal - yaConsumido);
          const cantidadEfectivamenteFacturada = Math.min(restanteParaFacturar, cantidadFacturadaActual);

          if (cantidadEfectivamenteFacturada === 0) continue;

          consumidosPorItemEnPedido.set(claveItemPedido, yaConsumido + cantidadEfectivamenteFacturada);

          dataPorMesFinal[mes].facturada += cantidadEfectivamenteFacturada;

          // Sumar a 'pedida' del mes de la factura (la cantidad pedida original del item, una sola vez por item de pedido por mes).
          if (!dataPorMesFinal[mes].itemsPedidosProcesadosEnMes.has(claveItemPedido)) {
              dataPorMesFinal[mes].pedida += cantidadPedidaOriginal;
              dataPorMesFinal[mes].itemsPedidosProcesadosEnMes.add(claveItemPedido);
          }
      }
  }

  // Limpiar propiedades auxiliares
  for (const mes in dataPorMesFinal) {
    delete dataPorMesFinal[mes].itemsPedidosProcesadosEnMes;
    delete dataPorMesFinal[mes].facturasProcesadasParaLeadTime;
  }

  const resultado = Object.entries(dataPorMesFinal)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      fillRate: v.pedida > 0 ? +(Math.min(v.facturada / v.pedida, 1) * 100).toFixed(2) : 0,
      leadTime: v.countLeadTime > 0 ? +(v.totalLeadTime / v.countLeadTime).toFixed(2) : null
    }));

  return resultado;
};

// --- Eficiencia por Cliente ---
export const obtenerEficienciaPorCliente = async (desde, hasta, filtroCliente) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Primero, obtenemos los números de pedido de las facturas que CUMPLEN con el rango de fechas
  const facturasEnRango = await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ["nro_pedido", "fecha_comp", "apellido_razon_soc"]
  });

  const nroPedidosConFacturasEnRango = [...new Set(facturasEnRango.map(f => f.nro_pedido))];

  if (nroPedidosConFacturasEnRango.length === 0) {
    return [];
  }

  // 2. Ahora, obtenemos los pedidos asociados a esos nro_pedidos encontrados en las facturas.
  // Aquí no filtramos por la fecha del pedido, ya que podría ser de un mes anterior.
  // Pero SÍ mantenemos el filtro por cliente si se proporcionó.
  const wherePedidos = {
    nro_pedido: { [Op.in]: nroPedidosConFacturasEnRango },
    ...(filtroCliente && { cliente: { [Op.like]: `%${filtroCliente}%` } }),
  };

  const pedidos = await PedidoDux.findAll({
    where: wherePedidos,
    attributes: ["id", "nro_pedido", "fecha", "cliente"],
  });

  const idPedidosConsiderados = pedidos.map(p => p.id);
  const nroPedidosConsiderados = pedidos.map(p => p.nro_pedido);

  // Mapear pedidos por su ID y por su nro_pedido para acceso rápido
  const pedidosPorNro = new Map(pedidos.map(p => [p.nro_pedido, p]));
  const pedidosPorId = new Map(pedidos.map(p => [p.id, p]));

  // 3. Obtener los detalles de los pedidos relevantes (solo de los pedidos que hemos considerado)
  const detallesPedidos = await DetallePedidoDux.findAll({
    where: {
      pedidoDuxId: { [Op.in]: idPedidosConsiderados },
    },
    attributes: ["id", "pedidoDuxId", "codItem", "cantidad", "precioUnitario"],
  });

  const cantidadesPedidosPorPedido = new Map(); // clave: pedidoId, valor: { cantidad, valor }

  for (const dp of detallesPedidos) {
    if (dp.codItem) {
      const cantidadItem = parseFloat(dp.cantidad || "0");
      const valorItem = cantidadItem * parseFloat(dp.precioUnitario || "0");

      const currentPedidoTotal = cantidadesPedidosPorPedido.get(dp.pedidoDuxId) || { cantidad: 0, valor: 0 };
      currentPedidoTotal.cantidad += cantidadItem;
      currentPedidoTotal.valor += valorItem;
      cantidadesPedidosPorPedido.set(dp.pedidoDuxId, currentPedidoTotal);
    }
  }

  // 4. Filtrar los detalles de factura para que solo incluyan los que corresponden a los pedidos que trajimos
  const detallesFacturasFiltradas = await DetalleFactura.findAll({
    attributes: ["id", "codItem", "cantidad", "precioUnitario"],
    include: {
      model: Factura,
      as: "factura",
      where: {
        nro_pedido: { [Op.in]: nroPedidosConsiderados },
        fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] }, // La fecha de la factura debe estar en el rango original
        anulada_boolean: false,
        tipo_comp: {
          [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
        }
      },
      attributes: ["fecha_comp", "nro_pedido", "apellido_razon_soc"]
    }
  });

  // Mapa para acumular los datos por cliente
  const clientesData = new Map();

  // 5. Acumular cantidades pedidas y valor total pedida para los clientes de los pedidos considerados
  // Este bucle se encarga de que la 'cantidadPedida' sea la real de los pedidos relevantes
  for (const pedido of pedidos) {
    const clienteNombre = pedido.cliente || "Sin nombre";
    const pedidoTotales = cantidadesPedidosPorPedido.get(pedido.id) || { cantidad: 0, valor: 0 };

    if (!clientesData.has(clienteNombre)) {
      clientesData.set(clienteNombre, {
        cliente: clienteNombre,
        totalPedida: 0,
        totalFacturada: 0,
        totalPedidoValor: 0,
        totalFacturadoValor: 0,
        totalLeadTime: 0,
        countLeadTime: 0,
      });
    }
    const clienteEntry = clientesData.get(clienteNombre);

    clienteEntry.totalPedida += pedidoTotales.cantidad;
    clienteEntry.totalPedidoValor += pedidoTotales.valor;
  }

  // 6. Procesar los detalles de las facturas para cantidades facturadas y lead time
  for (const df of detallesFacturasFiltradas) {
    const factura = df.factura;
    if (!factura || !df.codItem) continue;

    const pedido = pedidosPorNro.get(factura.nro_pedido);
    if (!pedido || !pedido.id) continue;

    const clienteNombre = pedido.cliente || "Sin nombre";
    const clienteEntry = clientesData.get(clienteNombre);

    if (!clienteEntry) {
        console.warn(`Cliente ${clienteNombre} para pedido ${pedido.nro_pedido} no encontrado en datos consolidados.`);
        continue;
    }

    // Sumamos la cantidad y el valor facturados
    clienteEntry.totalFacturada += parseFloat(df.cantidad || "0");
    clienteEntry.totalFacturadoValor += parseFloat(df.cantidad || "0") * parseFloat(df.precioUnitario || "0");

    // Calcular Lead Time para este ítem facturado
    const fechaFactura = new Date(factura.fecha_comp);
    const fechaPedido = new Date(pedido.fecha);
    const dias = Math.max(0, Math.round((fechaFactura - fechaPedido) / (1000 * 60 * 60 * 24)));

    clienteEntry.totalLeadTime += dias;
    clienteEntry.countLeadTime += 1;
  }

  // 7. Filtrar clientes y calcular métricas finales
  const resultado = Array.from(clientesData.values())
    .filter(entry => entry.totalFacturada > 0)
    .map(entry => {
      const fillRate = entry.totalPedida > 0
        ? +(Math.min(entry.totalFacturada / entry.totalPedida, 1) * 100).toFixed(2)
        : 0;

      const fillRatePonderado = entry.totalPedidoValor > 0
        ? +(Math.min(entry.totalFacturadoValor / entry.totalPedidoValor, 1) * 100).toFixed(2)
        : 0;

      const leadTimePromedio = entry.countLeadTime > 0
        ? +(entry.totalLeadTime / entry.countLeadTime).toFixed(2)
        : null;

      return {
        cliente: entry.cliente,
        cantidadPedida: +entry.totalPedida.toFixed(2),
        cantidadFacturada: +entry.totalFacturada.toFixed(2),
        totalPedido: +entry.totalPedidoValor.toFixed(2),
        totalFacturado: +entry.totalFacturadoValor.toFixed(2),
        fillRate,
        fillRatePonderado,
        leadTimePromedio,
      };
    })
    .sort((a, b) => a.cliente.localeCompare(b.cliente));

  return resultado;
};

// --- Detalle por Cliente ---
export const obtenerDetallePorCliente = async (desde, hasta, cliente) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const filtroCliente = cliente?.toLowerCase();

  // 1. Obtener TODAS las facturas que están en el rango de fechas.
  // Es el punto de partida para encontrar los nro_pedidos relevantes.
  const facturasEnRango = await Factura.findAll({
    where: {
      fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ["nro_pedido", "fecha_comp", "apellido_razon_soc"]
  });

  const nroPedidosConFacturasEnRango = [...new Set(facturasEnRango.map(f => f.nro_pedido))];

  if (nroPedidosConFacturasEnRango.length === 0) {
    return [];
  }

  // 2. Obtener los PEDIDOS asociados a esos nro_pedidos de factura, y que correspondan al cliente.
  // NO filtramos por la fecha del pedido aquí.
  const pedidos = await PedidoDux.findAll({
    where: {
      nro_pedido: { [Op.in]: nroPedidosConFacturasEnRango },
      cliente: { [Op.like]: `%${filtroCliente}%` },
    },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente']
  });

  const idPedidosConsiderados = pedidos.map(p => p.id);
  const nroPedidosConsiderados = pedidos.map(p => p.nro_pedido);

  if (pedidos.length === 0) {
    return [];
  }

  // Mapear pedidos por su ID y por su nro_pedido para acceso rápido
  const pedidosPorNro = new Map(pedidos.map(p => [p.nro_pedido, p]));
  // const pedidosPorId = new Map(pedidos.map(p => [p.id, p])); // No se usa directamente en este flujo

  // 3. Obtener los detalles de los pedidos relevantes
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidosConsiderados } },
    attributes: ['id', 'pedidoDuxId', 'codItem', 'cantidad', 'precioUnitario']
  });

  const detallesPedidosPorPedido = new Map();
  for (const dp of detallesPedidosDB) {
    if (!detallesPedidosPorPedido.has(dp.pedidoDuxId)) {
      detallesPedidosPorPedido.set(dp.pedidoDuxId, []);
    }
    detallesPedidosPorPedido.get(dp.pedidoDuxId).push(dp);
  }

  // 4. Obtener TODAS las facturas (y sus detalles) asociadas a los nro_pedidos considerados.
  // SIN FILTRO DE FECHA DE FACTURA AQUÍ, para obtener TODAS las facturas de esos pedidos.
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosConsiderados }, // Usar nroPedidosConsiderados
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp", "apellido_razon_soc"],
      include: [{
          model: DetalleFactura,
          as: "detalles", // Asegúrate de que este alias coincide con tu modelo Factura
          attributes: ["id", "codItem", "cantidad", "precioUnitario"]
      }]
  });

  // Mapear facturas y sus detalles para acceso rápido por nro_pedido
  const facturasParaLeadTime = new Map(); // Para lead time: la primera factura para el pedido
  const todasFechasFacturasPorNro = new Map(); // Para lista de fechas únicas
  const detallesFacturasPorPedido = new Map(); // Para sumar cantidades facturadas

  for (const factura of facturasAsociadas) {
    const nroPedido = factura.nro_pedido;

    // Si el nro_pedido de la factura no está entre los nro_pedidos que consideramos, la saltamos.
    // Esto es una doble verificación para asegurar que solo procesamos facturas de los pedidos que están en 'pedidos'.
    if (!pedidosPorNro.has(nroPedido)) {
        continue;
    }

    if (!facturasParaLeadTime.has(nroPedido)) {
      facturasParaLeadTime.set(nroPedido, factura);
    }

    if (!todasFechasFacturasPorNro.has(nroPedido)) {
      todasFechasFacturasPorNro.set(nroPedido, new Set());
    }
    if (factura.fecha_comp) {
      todasFechasFacturasPorNro.get(nroPedido).add(formatFecha(factura.fecha_comp));
    }

    if (!detallesFacturasPorPedido.has(nroPedido)) {
      detallesFacturasPorPedido.set(nroPedido, []);
    }
    if (factura.detalles && Array.isArray(factura.detalles)) {
      factura.detalles.forEach(df => {
        detallesFacturasPorPedido.get(nroPedido).push(df);
      });
    }
  }
  
  // 5. Procesar y calcular métricas para cada pedido
  const resultado = pedidos.map(pedido => {
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
    const totalPedido = detallesP.reduce((acc, d) => acc + (parseFloat(d.cantidad || 0) * parseFloat(d.precioUnitario || 0)), 0);

    const detallesF = detallesFacturasPorPedido.get(pedido.nro_pedido) || [];
    const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
    const totalFacturado = detallesF.reduce((acc, d) => acc + (parseFloat(d.cantidad || 0) * parseFloat(d.precioUnitario || 0)), 0);

    const fillRate = cantidadPedida > 0
      ? +(Math.min(cantidadFacturada / cantidadPedida, 1) * 100).toFixed(2)
      : 0;

    const fillRatePonderado = totalPedido > 0
      ? +(Math.min(totalFacturado / totalPedido, 1) * 100).toFixed(2)
      : 0;

    const facturaPrincipal = facturasParaLeadTime.get(pedido.nro_pedido);
    
    let leadTimeDias = null;
    if (facturaPrincipal && cantidadFacturada > 0) {
        leadTimeDias = Math.max(0, Math.round((new Date(facturaPrincipal.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
    }
    const fechasFacturasArray = todasFechasFacturasPorNro.has(pedido.nro_pedido) 
                             ? Array.from(todasFechasFacturasPorNro.get(pedido.nro_pedido)).sort()
                             : [];

    return {
      pedidoId: pedido.id,
      nroPedido: pedido.nro_pedido,
      fechaPedido: formatFecha(pedido.fecha),
      fechasFacturas: fechasFacturasArray.length > 0 ? fechasFacturasArray.join(', ') : '—',
      cantidadPedida: +cantidadPedida.toFixed(2),
      cantidadFacturada: +cantidadFacturada.toFixed(2),
      fillRate: +fillRate.toFixed(2),
      leadTimeDias,
      totalPedido: +totalPedido.toFixed(2),
      totalFacturado: +totalFacturado.toFixed(2),
      fillRatePonderado: +fillRatePonderado.toFixed(2),
    };
  });

  return resultado;
};

// --- Detalle por Pedido (obtener un pedido específico) ---
export const obtenerDetallePorPedido = async (pedidoId) => {
  const pedido = await PedidoDux.findByPk(pedidoId);
  if (!pedido) return null;

  const detallesPedido = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: pedidoId },
    attributes: ['codItem', 'descripcion', 'cantidad', 'precioUnitario']
  });

  // Obtener todas las facturas y sus detalles para este pedido
  const facturasAsociadas = await Factura.findAll({
    where: {
      nro_pedido: pedido.nro_pedido,
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['fecha_comp', 'nro_pedido'],
    include: [{
      model: DetalleFactura,
      as: "detalles",
      attributes: ['codItem', 'cantidad', 'precioUnitario']
    }],
  });

  const mapFacturadas = {}; // key: codItem, value: cantidad_facturada_total
  const mapTotalFacturadoValor = {}; // key: codItem, value: valor_facturado_total
  // Nuevo: map para la primera fecha de factura por codItem
  const mapPrimeraFechaFacturaItem = {}; // key: codItem, value: Date (fecha más temprana de factura para ese item)

  for (const factura of facturasAsociadas) {
    const fechaFacturaActual = new Date(factura.fecha_comp);
    for (const det of factura.detalles || []) {
      const cod = det.codItem;
      const cant = parseFloat(det.cantidad || 0);
      const precio = parseFloat(det.precioUnitario || 0);

      if (!mapFacturadas[cod]) mapFacturadas[cod] = 0;
      if (!mapTotalFacturadoValor[cod]) mapTotalFacturadoValor[cod] = 0;
      
      mapFacturadas[cod] += cant;
      mapTotalFacturadoValor[cod] += cant * precio;

      // Almacenar la fecha de factura más temprana para cada item
      if (!mapPrimeraFechaFacturaItem[cod] || fechaFacturaActual < mapPrimeraFechaFacturaItem[cod]) {
          mapPrimeraFechaFacturaItem[cod] = fechaFacturaActual;
      }
    }
  }

  let leadTimePedido = null; // Lead time para el pedido completo
  let fechasFacturas = [];
  let totalCantidadFacturadaPedido = 0;
  let totalFacturadoValorPedido = 0;

  if (facturasAsociadas.length) {
    // Para el lead time del pedido completo, usamos la fecha de la factura más temprana
    const fechas = facturasAsociadas.map(f => new Date(f.fecha_comp)).sort((a, b) => a - b);
    const fechaFacturaMasTempranaPedido = fechas[0];

    totalCantidadFacturadaPedido = Object.values(mapFacturadas).reduce((sum, val) => sum + val, 0);
    totalFacturadoValorPedido = Object.values(mapTotalFacturadoValor).reduce((sum, val) => sum + val, 0);

    if (totalCantidadFacturadaPedido > 0) {
      leadTimePedido = Math.max(
        0,
        Math.round((fechaFacturaMasTempranaPedido - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24))
      );
    }
    
    fechasFacturas = [...new Set(facturasAsociadas.map(f => formatFecha(f.fecha_comp)))].sort();
  }

  let totalCantidadPedidaPedido = 0;
  let totalPedidoValorPedido = 0;

  const productosDetalle = detallesPedido.map(p => {
    const cantidadPedida = parseFloat(p.cantidad || 0);
    const precioUnitarioPedido = parseFloat(p.precioUnitario || 0);
    const cantidadFacturada = mapFacturadas[p.codItem] || 0;
    const valorFacturadoItem = mapTotalFacturadoValor[p.codItem] || 0;

    totalCantidadPedidaPedido += cantidadPedida;
    totalPedidoValorPedido += cantidadPedida * precioUnitarioPedido;

    const fillRate = cantidadPedida > 0
      ? +(Math.min(cantidadFacturada / cantidadPedida, 1) * 100).toFixed(2)
      : 0;

    // Calcular lead time para este ítem específico
    let leadTimeItem = null;
    if (cantidadFacturada > 0 && mapPrimeraFechaFacturaItem[p.codItem]) {
        leadTimeItem = Math.max(0, Math.round(
            (mapPrimeraFechaFacturaItem[p.codItem] - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)
        ));
    }

    return {
      codItem: p.codItem,
      descripcion: p.descripcion || "Sin descripción",
      cantidadPedida: +cantidadPedida.toFixed(2),
      cantidadFacturada: +cantidadFacturada.toFixed(2),
      fillRate,
      precioUnitarioPedido: +precioUnitarioPedido.toFixed(2),
      valorFacturadoItem: +valorFacturadoItem.toFixed(2),
      leadTimeItem
    };
  });

  return {
    nroPedido: pedido.nro_pedido,
    fechaPedido: formatFecha(pedido.fecha),
    leadTimePedido, // Lead time del pedido completo
    fechasFacturas: fechasFacturas.length > 0 ? fechasFacturas.join(', ') : '—',
    totalCantidadPedida: +totalCantidadPedidaPedido.toFixed(2),
    totalCantidadFacturada: +totalCantidadFacturadaPedido.toFixed(2),
    totalPedidoValor: +totalPedidoValorPedido.toFixed(2),
    totalFacturadoValor: +totalFacturadoValorPedido.toFixed(2),
    productos: productosDetalle
  };
};

// --- Eficiencia por Producto ---
export const obtenerEficienciaPorProducto = async (desde, hasta, filtro) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);
  const filtroProducto = filtro?.toLowerCase() || "";

  // 1. Obtener pedidos en el rango de fecha de pedido
  const pedidosEnRango = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ['id', 'nro_pedido', 'fecha']
  });
  const idPedidosEnRango = pedidosEnRango.map(p => p.id);
  const nroPedidosEnRango = pedidosEnRango.map(p => p.nro_pedido);
  const pedidoFechaMap = new Map(pedidosEnRango.map(p => [p.nro_pedido, p.fecha]));


  // 2. Obtener DetallePedidos asociados a los pedidos en rango
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidosEnRango } },
    attributes: ['codItem', 'descripcion', 'cantidad']
  });

  // 3. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosEnRango },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp"],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          attributes: ["codItem", "cantidad", "descripcion"]
      }]
  });


  const pedidasPorProducto = {}; // key: codItem, value: { producto: desc, pedida: sum }
  const facturadasPorProducto = {}; // key: codItem, value: { producto: desc, facturada: sum, leadTimes: [] }

  for (const dp of detallesPedidosDB) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!filtroProducto || key.toLowerCase().includes(filtroProducto) || desc.toLowerCase().includes(filtroProducto)) {
      if (!pedidasPorProducto[key]) pedidasPorProducto[key] = { producto: desc, pedida: 0 };
      pedidasPorProducto[key].pedida += parseFloat(dp.cantidad || 0);
    }
  }

  for (const factura of facturasAsociadas) {
      if (!Array.isArray(factura.detalles)) continue;
      for (const df of factura.detalles) {
          const key = df.codItem;
          const desc = (pedidasPorProducto[key] && pedidasPorProducto[key].producto) || df.descripcion || key; 
          
          if (!filtroProducto || key.toLowerCase().includes(filtroProducto) || desc.toLowerCase().includes(filtroProducto)) {
              if (!facturadasPorProducto[key]) facturadasPorProducto[key] = { producto: desc, facturada: 0, leadTimes: [] };
              facturadasPorProducto[key].facturada += parseFloat(df.cantidad || 0);

              const fechaPedido = pedidoFechaMap.get(factura.nro_pedido);
              if (fechaPedido) {
                  const diff = Math.max(0, Math.round(
                      (new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)
                  ));
                  facturadasPorProducto[key].leadTimes.push(diff);
              }
          }
      }
  }

  const resultado = Object.keys(pedidasPorProducto).map(key => {
    const pedidaData = pedidasPorProducto[key];
    const facturadaData = facturadasPorProducto[key] || { facturada: 0, leadTimes: [] };

    const pedidas = pedidaData.pedida;
    const facturadas = facturadaData.facturada;
    const leadTimes = facturadaData.leadTimes;

    const fillRate = pedidas > 0 ? +(Math.min(facturadas / pedidas, 1) * 100).toFixed(2) : 0;
    const leadTimePromedio = leadTimes.length > 0
      ? +(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(2)
      : null;

    return {
      producto: pedidaData.producto,
      cantidadPedida: +pedidas.toFixed(2),
      cantidadFacturada: +facturadas.toFixed(2),
      fillRate,
      leadTimePromedio
    };
  }).filter(item => item.cantidadPedida > 0 || item.cantidadFacturada > 0);

  return resultado;
};

// --- Detalle por Producto ---
export const obtenerDetallePorProducto = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener pedidos en el rango de fecha de pedido
  const pedidosEnRango = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ['id', 'nro_pedido']
  });
  const idPedidosEnRango = pedidosEnRango.map(p => p.id);
  const nroPedidosEnRango = pedidosEnRango.map(p => p.nro_pedido);

  // 2. Obtener DetallePedidos asociados a los pedidos en rango
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidosEnRango } },
    attributes: ['codItem', 'descripcion', 'cantidad']
  });

  // 3. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosEnRango },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp"],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          attributes: ["codItem", "cantidad", "descripcion"]
      }]
  });

  const map = new Map(); // key: codItem, value: { codItem, descripcion, pedida, facturada }

  for (const dp of detallesPedidosDB) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!map.has(key)) {
      map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
    }
    const item = map.get(key);
    item.pedida += parseFloat(dp.cantidad || 0);
  }

  for (const factura of facturasAsociadas) {
      if (!Array.isArray(factura.detalles)) continue;
      for (const df of factura.detalles) {
          const key = df.codItem;
          const desc = df.descripcion || key;
          if (!map.has(key)) {
            map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
          }
          const item = map.get(key);
          item.facturada += parseFloat(df.cantidad || 0);
      }
  }

  const resultado = Array.from(map.values()).map((item) => ({
    ...item,
    diferencia: +(item.facturada - item.pedida).toFixed(2)
  }));

  return resultado;
};

// --- Eficiencia por Categoría ---
export const obtenerEficienciaPorCategoria = async (desde, hasta, categoriaId) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener Categorías válidas (excluye las que contienen "producción")
  const categorias = await Categoria.findAll({
    where: where(fn('LOWER', col('nombre')), {
      [Op.notLike]: '%producción%'
    }),
    attributes: ['id', 'nombre']
  });
  const categoriasValidas = new Set(categorias.map(c => c.id));
  const categoriaNombreMap = new Map(categorias.map(c => [c.id, c.nombre]));

  // 2. Obtener Productos que pertenecen solo a categorías válidas
  const productos = await Producto.findAll({
    where: { categoriaId: { [Op.in]: Array.from(categoriasValidas) } },
    attributes: ['sku', 'categoriaId']
  });
  const productoCategoriaMap = new Map(productos.map(p => [p.sku, p.categoriaId]));
  
  if (productos.length === 0) return [];


  // 3. Obtener Pedidos en el rango de fecha de pedido
  const pedidosEnRango = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ['id', 'nro_pedido', 'fecha']
  });
  const idPedidosEnRango = pedidosEnRango.map(p => p.id);
  const nroPedidosEnRango = pedidosEnRango.map(p => p.nro_pedido);
  const pedidoFechaMap = new Map(pedidosEnRango.map(p => [p.nro_pedido, p.fecha]));


  // 4. Obtener Detalles de Pedidos asociados a los pedidos en rango
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: idPedidosEnRango } },
    attributes: ['codItem', 'cantidad'] // Solo necesitamos codItem y cantidad
  });

  // 5. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosEnRango },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp"],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          attributes: ["codItem", "cantidad"]
      }]
  });

  const resumenPorCategoria = {}; // key: categoriaId, value: { nombre, cantidadPedida, cantidadFacturada, leadTimes }


  for (const dp of detallesPedidosDB) {
    const codItem = dp.codItem;
    const catId = productoCategoriaMap.get(codItem);
    
    if (!catId || !categoriasValidas.has(catId) || (categoriaId && catId != categoriaId)) continue;

    if (!resumenPorCategoria[catId]) {
      resumenPorCategoria[catId] = {
        nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
        cantidadPedida: 0,
        cantidadFacturada: 0,
        leadTimes: [],
      };
    }
    resumenPorCategoria[catId].cantidadPedida += parseFloat(dp.cantidad || 0);
  }

  for (const factura of facturasAsociadas) {
      if (!Array.isArray(factura.detalles)) continue;
      for (const df of factura.detalles) {
          const codItem = df.codItem;
          const catId = productoCategoriaMap.get(codItem);

          if (!catId || !categoriasValidas.has(catId) || (categoriaId && catId != categoriaId)) continue;

          const cantidadFacturada = parseFloat(df.cantidad || 0);
          if (cantidadFacturada === 0) continue;

          if (!resumenPorCategoria[catId]) {
              resumenPorCategoria[catId] = {
                  nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
                  cantidadPedida: 0,
                  cantidadFacturada: 0,
                  leadTimes: [],
              };
          }

          resumenPorCategoria[catId].cantidadFacturada += cantidadFacturada;

          const fechaPedido = pedidoFechaMap.get(factura.nro_pedido);
          if (fechaPedido) {
              const dias = Math.max(0, Math.round((new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)));
              resumenPorCategoria[catId].leadTimes.push(dias);
          }
      }
  }

  const resultado = Object.entries(resumenPorCategoria)
    .filter(([_, data]) => data.cantidadPedida > 0 || data.cantidadFacturada > 0)
    .map(([catId, data]) => {
      const fillRate = data.cantidadPedida > 0
        ? +(Math.min(data.cantidadFacturada / data.cantidadPedida, 1) * 100).toFixed(2)
        : 0;

      const leadTimePromedio = data.leadTimes.length > 0
        ? +(data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length).toFixed(2)
        : null;

      return {
        categoria: catId,
        categoriaNombre: data.nombre,
        cantidadPedida: +data.cantidadPedida.toFixed(2),
        cantidadFacturada: +data.cantidadFacturada.toFixed(2),
        fillRate,
        leadTimePromedio
      };
    });

  return resultado;
};

// --- Detalle por Categoría ---
export const obtenerDetallePorCategoria = async (desde, hasta, categoriaId) => {
  const desdeFecha = new Date(desde);
  const hastaFecha = new Date(hasta);

  // 1. Obtener Categorías válidas (excluye las que contienen "producción")
  const categorias = await Categoria.findAll({
    where: where(fn('LOWER', col('nombre')), {
      [Op.notLike]: '%producción%'
    }),
    attributes: ['id']
  });
  const categoriasValidas = new Set(categorias.map(c => c.id));

  // 2. Obtener Productos que pertenecen a la categoría seleccionada (y que sea válida)
  const productosEnCategoria = await Producto.findAll({
    where: {
      sku: { [Op.ne]: null },
      categoriaId: categoriaId
    },
    attributes: ['sku']
  });
  const skusEnCategoria = new Set(productosEnCategoria.map(p => p.sku));

  if (!categoriasValidas.has(parseInt(categoriaId)) || skusEnCategoria.size === 0) {
      return [];
  }

  // 3. Obtener pedidos en el rango de fecha de pedido
  const pedidosEnRango = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [desdeFecha, hastaFecha] } },
    attributes: ['id', 'nro_pedido', 'fecha']
  });
  const idPedidosEnRango = pedidosEnRango.map(p => p.id);
  const nroPedidosEnRango = pedidosEnRango.map(p => p.nro_pedido);
  const pedidosPorId = new Map(pedidosEnRango.map(p => [p.id, p])); // Necesario para el bucle
  const pedidoFechaMap = new Map(pedidosEnRango.map(p => [p.nro_pedido, p.fecha]));


  // 4. Obtener Detalles de Pedidos para los productos de la categoría y pedidos en rango
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: {
      pedidoDuxId: { [Op.in]: idPedidosEnRango },
      codItem: { [Op.in]: Array.from(skusEnCategoria) }
    },
    attributes: ['pedidoDuxId', 'codItem', 'cantidad', 'descripcion']
  });

  // 5. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  const facturasAsociadas = await Factura.findAll({
      where: {
          nro_pedido: { [Op.in]: nroPedidosEnRango },
          anulada_boolean: false,
          tipo_comp: {
              [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
          }
      },
      attributes: ["nro_pedido", "fecha_comp"],
      include: [{
          model: DetalleFactura,
          as: 'detalles', // ✅ CORRECCIÓN DE ALIAS
          where: {
              codItem: { [Op.in]: Array.from(skusEnCategoria) }
          },
          attributes: ["codItem", "cantidad"]
      }]
  });

  const agrupado = {}; // key: nro_pedido, value: { nroPedido, fecha, cantidadPedida, cantidadFacturada, leadTimeDias }

  for (const dp of detallesPedidosDB) {
    const pedido = pedidosPorId.get(dp.pedidoDuxId);
    if (!pedido) continue;

    if (!agrupado[pedido.nro_pedido]) {
      agrupado[pedido.nro_pedido] = {
        nroPedido: pedido.nro_pedido,
        fecha: pedido.fecha,
        cantidadPedida: 0,
        cantidadFacturada: 0,
        leadTimeDias: null
      };
    }
    agrupado[pedido.nro_pedido].cantidadPedida += parseFloat(dp.cantidad || 0);
  }

  for (const factura of facturasAsociadas) {
      if (!Array.isArray(factura.detalles)) continue;
      for (const df of factura.detalles) {
          const nro = factura.nro_pedido;
          if (nro && agrupado[nro]) {
              agrupado[nro].cantidadFacturada += parseFloat(df.cantidad || 0);
              
              if (factura.fecha_comp && agrupado[nro].fecha) {
                  const diff = Math.max(0, Math.round(
                    (new Date(factura.fecha_comp) - new Date(agrupado[nro].fecha)) / (1000 * 60 * 60 * 24)
                  ));
                  agrupado[nro].leadTimeDias = diff;
              }
          }
      }
  }

  const resultado = Object.values(agrupado).map((p) => {
    const fillRate = p.cantidadPedida > 0
      ? +(Math.min(p.cantidadFacturada / p.cantidadPedida, 1) * 100).toFixed(2)
      : 0;

    return {
      nroPedido: p.nroPedido,
      fechaPedido: formatFecha(p.fecha),
      cantidadPedida: +p.cantidadPedida.toFixed(2),
      cantidadFacturada: +p.cantidadFacturada.toFixed(2),
      fillRate,
      leadTimeDias: p.leadTimeDias
    };
  }).filter(p => p.cantidadPedida > 0 || p.cantidadFacturada > 0);

  return resultado;
};

// --- Eficiencia por Pedido ---
export const obtenerEficienciaPorPedido = async (desde, hasta) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  // 1. Obtener los pedidos en el rango de fecha de pedido
  const pedidos = await PedidoDux.findAll({
    where: {
      fecha: { [Op.between]: [fechaDesde, fechaHasta] }
    },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente'] // Incluimos cliente para el contexto si se necesitara en el futuro
  });

  const idPedidos = pedidos.map(p => p.id);
  const nroPedidos = pedidos.map(p => p.nro_pedido);

  // 2. Obtener los detalles de los pedidos relevantes
  const detallesPedidosDB = await DetallePedidoDux.findAll({
    where: {
      pedidoDuxId: { [Op.in]: idPedidos }
    },
    attributes: ['pedidoDuxId', 'cantidad', 'precioUnitario']
  });

  // Mapear detalles de pedidos por pedidoDuxId
  const detallesPedidosPorPedido = new Map();
  for (const dp of detallesPedidosDB) {
    if (!detallesPedidosPorPedido.has(dp.pedidoDuxId)) {
      detallesPedidosPorPedido.set(dp.pedidoDuxId, []);
    }
    detallesPedidosPorPedido.get(dp.pedidoDuxId).push(dp);
  }

  // 3. Obtener TODAS las facturas (y sus detalles) asociadas a esos nro_pedidos
  // SIN filtro de fecha de factura para capturar todas las facturas de estos pedidos
  const facturasAsociadas = await Factura.findAll({
    where: {
      nro_pedido: { [Op.in]: nroPedidos },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['nro_pedido', 'fecha_comp'],
    include: [{
      model: DetalleFactura,
      as: 'detalles',
      attributes: ['cantidad']
    }]
  });

  // Mapear facturas y sus detalles
  const facturasParaLeadTime = new Map(); // Guarda la primera factura para el lead time
  const detallesFacturasPorPedido = new Map(); // Guarda todos los detalles de factura por pedido

  for (const factura of facturasAsociadas) {
    const nroPedido = factura.nro_pedido;
    if (!facturasParaLeadTime.has(nroPedido)) {
      facturasParaLeadTime.set(nroPedido, factura); // Guardar la primera factura para este pedido
    }
    if (factura.detalles && Array.isArray(factura.detalles)) {
      if (!detallesFacturasPorPedido.has(nroPedido)) {
        detallesFacturasPorPedido.set(nroPedido, []);
      }
      factura.detalles.forEach(df => {
        detallesFacturasPorPedido.get(nroPedido).push(df);
      });
    }
  }

  // 4. Procesar cada pedido y calcular sus métricas
  const resultado = pedidos.map(pedido => {
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
    const totalPedido = detallesP.reduce((acc, d) => acc + (parseFloat(d.cantidad || 0) * parseFloat(d.precioUnitario || 0)), 0);


    const detallesF = detallesFacturasPorPedido.get(pedido.nro_pedido) || [];
    const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
    const totalFacturado = detallesF.reduce((acc, d) => acc + (parseFloat(d.cantidad || 0) * parseFloat(d.precioUnitario || 0)), 0); // Asumiendo precioUnitario en DetalleFactura


    const fillRate = cantidadPedida > 0 ? +(Math.min((cantidadFacturada / cantidadPedida), 1) * 100).toFixed(2) : 0;

    const facturaPrincipal = facturasParaLeadTime.get(pedido.nro_pedido);
    let leadTimeDias = null;
    if (facturaPrincipal && cantidadFacturada > 0) { // Solo si hay factura y se facturó algo
      leadTimeDias = Math.max(0, Math.round((new Date(facturaPrincipal.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
    }

    return {
      pedidoId: pedido.id,
      nroPedido: pedido.nro_pedido,
      fechaPedido: formatFecha(pedido.fecha),
      cantidadPedida: +cantidadPedida.toFixed(2),
      cantidadFacturada: +cantidadFacturada.toFixed(2),
      totalPedido: +totalPedido.toFixed(2),
      totalFacturado: +totalFacturado.toFixed(2),
      fillRate,
      leadTimeDias
    };
  });

  return resultado;
};