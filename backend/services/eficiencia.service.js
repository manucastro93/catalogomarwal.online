import { Op } from 'sequelize';
import { PedidoDux, DetallePedidoDux, Factura, DetalleFactura, Cliente } from '../models/index.js';

export const generarResumenEjecutivo = async (desde, hasta, comparar = true) => {
  const fechaDesde = new Date(desde);
  const fechaHasta = new Date(hasta);

  const pedidos = await PedidoDux.findAll({
    where: { fecha: { [Op.between]: [fechaDesde, fechaHasta] } },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente'],
  });

  const nroPedidos = pedidos.map(p => p.nro_pedido);
  const pedidosPorId = new Map(pedidos.map(p => [p.id, p]));

  const facturas = await Factura.findAll({
    where: {
      nro_pedido: { [Op.in]: nroPedidos },
      anulada_boolean: false,
      tipo_comp: {
        [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
      }
    },
    attributes: ['nro_pedido', 'fecha_comp'],
  });

  const facturasPorPedido = new Map();
  for (const f of facturas) {
    if (!facturasPorPedido.has(f.nro_pedido)) facturasPorPedido.set(f.nro_pedido, []);
    facturasPorPedido.get(f.nro_pedido).push(f);
  }

  const detallesPedidos = await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: pedidos.map(p => p.id) } },
    attributes: ['pedidoDuxId', 'cantidad', 'descripcion'],
  });

  const detallesFacturas = await DetalleFactura.findAll({
    include: [{
      model: Factura,
      as: 'factura',
      where: {
        nro_pedido: { [Op.in]: nroPedidos },
        anulada_boolean: false,
      },
      attributes: ['nro_pedido']
    }],
    attributes: ['cantidad', 'descripcion']
  });

  const totalPedidos = pedidos.length;
  const totalFacturas = new Set(facturas.map(f => f.nro_pedido)).size;

  let totalCantidadPedida = 0;
  let totalCantidadFacturada = 0;
  let sumaLeadTime = 0;
  let totalLeadTime = 0;
  let pedidosConRetraso = 0;

  const fillRates = [];
  const eficienciaPorCliente = {};
  const sinFacturarPorProducto = {};

  for (const pedido of pedidos) {
    const detallesP = detallesPedidos.filter(d => d.pedidoDuxId === pedido.id);
    const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
    const detallesF = detallesFacturas.filter(df => df.factura?.nro_pedido === pedido.nro_pedido);
    const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

    const tieneFactura = facturasPorPedido.has(pedido.nro_pedido);
    if (!tieneFactura || cantidadFacturada === 0) continue; // salteamos pedido sin facturación

    totalCantidadPedida += cantidadPedida;
    totalCantidadFacturada += cantidadFacturada;

    const fillRate = cantidadPedida > 0 ? Math.min((cantidadFacturada / cantidadPedida) * 100, 100) : 0;
    fillRates.push(fillRate);

    const fechaFactura = facturasPorPedido.get(pedido.nro_pedido)[0].fecha_comp;
    const leadTime = Math.max(0, Math.round((new Date(fechaFactura) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)));
    sumaLeadTime += leadTime;
    totalLeadTime++;
    if (leadTime > 7) pedidosConRetraso++;

    // eficiencia por cliente
    const nombreCliente = (pedido.cliente || '').trim();
    if (!eficienciaPorCliente[nombreCliente]) {
      eficienciaPorCliente[nombreCliente] = { pedidos: 0, totalFillRate: 0 };
    }
    eficienciaPorCliente[nombreCliente].pedidos++;
    eficienciaPorCliente[nombreCliente].totalFillRate += fillRate;

    // productos problema
    for (const d of detallesP) {
      const facturados = detallesF.filter(df => df.descripcion === d.descripcion);
      const cantidadFacturadaItem = facturados.reduce((acc, f) => acc + parseFloat(f.cantidad || 0), 0);
      const diferencia = Math.max(0, d.cantidad - cantidadFacturadaItem);

      if (diferencia > 0) {
        if (!sinFacturarPorProducto[d.descripcion]) sinFacturarPorProducto[d.descripcion] = 0;
        sinFacturarPorProducto[d.descripcion] += diferencia;
      }
    }
  }

  const fillRateGeneral = totalCantidadPedida > 0
    ? Math.min((totalCantidadFacturada / totalCantidadPedida) * 100, 100)
    : 0;

  const leadTimePromedioDias = totalLeadTime > 0
    ? Math.round(sumaLeadTime / totalLeadTime)
    : null;

  const porcentajeAltos = fillRates.length
    ? (fillRates.filter(f => f >= 95).length / fillRates.length) * 100
    : 0;

  const porcentajeBajos = fillRates.length
    ? (fillRates.filter(f => f < 80).length / fillRates.length) * 100
    : 0;

  const topClientesEficientes = Object.entries(eficienciaPorCliente)
    .map(([cliente, datos]) => ({
      cliente,
      fillRate: +(datos.totalFillRate / datos.pedidos).toFixed(2)
    }))
    .sort((a, b) => b.fillRate - a.fillRate)
    .slice(0, 5);

    const topClientesIneficientes = Object.entries(eficienciaPorCliente)
  .map(([cliente, datos]) => ({
    cliente,
    fillRate: +(datos.totalFillRate / datos.pedidos).toFixed(2)
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
    const diasRango = Math.ceil((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24));
    const fechaDesdeAnterior = new Date(fechaDesde);
    fechaDesdeAnterior.setDate(fechaDesdeAnterior.getDate() - diasRango);
    const fechaHastaAnterior = new Date(fechaHasta);
    fechaHastaAnterior.setDate(fechaHastaAnterior.getDate() - diasRango);

    const anterior = await generarResumenEjecutivo(
      fechaDesdeAnterior.toISOString().slice(0, 10),
      fechaHastaAnterior.toISOString().slice(0, 10),
      false // 🚫 evitar recursividad infinita
    );

    variacionFillRate = anterior.fillRateGeneral
      ? +((fillRateGeneral - anterior.fillRateGeneral) / anterior.fillRateGeneral * 100).toFixed(1)
      : 0;

    variacionLeadTime = anterior.leadTimePromedioDias != null
      ? +(leadTimePromedioDias - anterior.leadTimePromedioDias)
      : 0;
  }

  return {
    totalPedidos,
    totalFacturas,
    fillRateGeneral: +fillRateGeneral.toFixed(2),
    leadTimePromedioDias,
    cantidadRetrasos: pedidosConRetraso,
    porcentajePedidosAltosFillRate: +porcentajeAltos.toFixed(1),
    porcentajePedidosBajoFillRate: +porcentajeBajos.toFixed(1),
    variacionFillRate,
    variacionLeadTime,
    topClientesEficientes,
    topClientesIneficientes,
    topProductosProblema,
    categoriasCriticas: []
  };
};