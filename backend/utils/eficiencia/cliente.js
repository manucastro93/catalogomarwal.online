
import { toFloat, toFixed, formatFecha } from "./helpers.js";

/**
 * 🎯 Calcula y formatea el resumen de eficiencia por cliente.
 */
export function generarResumenEficienciaPorCliente({ pedidos, detallesPedidosPorPedido, detallesFacturasPorPedido, ultimaFacturaPorPedido }) {
  const resumenPorCliente = new Map();

  // Paso 1: Filtrar los pedidos que se van a considerar para el resumen de cada cliente.
  // Solo incluimos pedidos que tienen al menos un ítem facturado.
  const pedidosConFacturacion = pedidos.filter(pedido => {
      const nroPedidoNum = Number(pedido.nro_pedido);
      const detallesF = detallesFacturasPorPedido.get(nroPedidoNum) || [];
      const cantidadFacturadaEstePedido = detallesF.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
      return cantidadFacturadaEstePedido > 0; // Filtra pedidos con cantidad facturada > 0
  });

  // Paso 2: Iterar sobre los pedidos filtrados para acumular datos por cliente.
  for (const pedido of pedidosConFacturacion) { // CAMBIO: Iterar sobre los pedidos ya filtrados
    const nombreCliente = pedido.cliente || "Sin nombre";
    const detallesP = detallesPedidosPorPedido.get(pedido.id) || [];
    const nroPedidoNum = Number(pedido.nro_pedido); 
    const detallesF = detallesFacturasPorPedido.get(nroPedidoNum) || []; 
    const ultimaFactura = ultimaFacturaPorPedido.get(nroPedidoNum); 

    const cantidadPedida = detallesP.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
    const totalPedido = detallesP.reduce((acc, d) => acc + (toFloat(d.cantidad) * toFloat(d.precioUnitario)), 0);

    const cantidadFacturada = detallesF.reduce((acc, d) => acc + toFloat(d.cantidad), 0);
    const totalFacturado = detallesF.reduce((acc, d) => acc + (toFloat(d.cantidad) * toFloat(d.precioUnitario)), 0);

    // Calcular Lead Time usando la última factura
    const leadTimeDias = (ultimaFactura && cantidadFacturada > 0 && pedido.fecha && ultimaFactura.fecha_comp)
      ? Math.max(0, Math.round((new Date(ultimaFactura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
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

  // Paso 3: Mapear a la estructura final y ordenar.
  // El filtro `entry.cantidadFacturada > 0` ya no es estrictamente necesario aquí
  // porque `pedidosConFacturacion` ya asegura que solo se procesan pedidos con facturación.
  // Sin embargo, si un cliente no tiene *ningún* pedido facturado en el rango, su entrada no se crearía,
  // por lo que el .filter() al final es una doble verificación pero no dañina.
  return Array.from(resumenPorCliente.values())
    .filter(entry => entry.cantidadFacturada > 0) 
    .map(entry => {
      const fillRate = entry.cantidadPedida > 0
        ? toFixed(Math.min(entry.cantidadFacturada / entry.cantidadPedida, 1) * 100)
        : 0; // Si cantidadPedida es 0 (ej. cliente solo con pedidos cancelados), Fill Rate es 0.

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
