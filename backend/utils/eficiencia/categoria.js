// categoria.js
import { toFloat, toFixed, formatFecha } from "./helpers.js";

export function generarResumenEficienciaPorCategoria({
  categoriaIdFiltro,
  categoriasValidas,
  categoriaNombreMap,
  productoCategoriaMap,
  detallesPedidos,
  facturasCompletas,
  pedidosPorId,
  pedidosPorNro,
}) {
  const resumen = new Map();

  // 🔍 1. Detectar pedidos que tuvieron al menos un ítem facturado
  const pedidosConFacturacion = new Set();
  // Este loop ahora es más sencillo y robusto
  for (const factura of facturasCompletas) {
    const nroPedido = Number(factura.nro_pedido); // Asegura que sea número
    const pedido = pedidosPorNro.get(nroPedido); // <--- Busca el pedido directamente por nro_pedido
    if (pedido) {
        pedidosConFacturacion.add(pedido.id); // Agrega el ID del pedido
    }
  }

  // 🔄 2. Acumular cantidades pedidas
  for (const dp of detallesPedidos) {
    // Si el pedido al que pertenece este detalle NO está en la lista de los que tuvieron facturas, lo ignoramos.
    // Esto es lo que quieres según tu aclaración.
    if (!pedidosConFacturacion.has(dp.pedidoDuxId)) {
      continue;
    }

    const codItem = dp.codItem;
    const catId = productoCategoriaMap.get(codItem);
    if (!catId || !categoriasValidas.has(catId)) continue;
    if (categoriaIdFiltro && catId !== categoriaIdFiltro) continue;

    const precioUnitario = toFloat(dp.precioUnitario || 0);
    const cantidad = toFloat(dp.cantidad);
    const valor = cantidad * precioUnitario;

    const current = resumen.get(catId) || {
      nombre: categoriaNombreMap.get(catId) || "Sin categoría",
      cantidadPedida: 0,
      cantidadFacturada: 0,
      valorPedido: 0,
      valorFacturado: 0,
      leadTimes: [],
    };

    current.cantidadPedida += cantidad;
    current.valorPedido += valor;
    resumen.set(catId, current);
  }

  // 🔄 3. Acumular cantidades facturadas
  for (const factura of facturasCompletas) {
    const nroPedido = Number(factura.nro_pedido); // Asegura que sea número
    const pedido = pedidosPorNro.get(nroPedido); // <--- Usa el mapa directamente
    const fechaPedido = pedido?.fecha;

    for (const df of factura.detalles || []) {
      const codItem = df.codItem;
      const catId = productoCategoriaMap.get(codItem);
      if (!catId || !categoriasValidas.has(catId)) continue;
      if (categoriaIdFiltro && catId !== categoriaIdFiltro) continue;

      const cantidadFacturada = toFloat(df.cantidad);
      const precioUnitario = toFloat(df.precioUnitario || 0);
      const valorFacturado = cantidadFacturada * precioUnitario;

      const current = resumen.get(catId) || {
        nombre: categoriaNombreMap.get(catId) || "Sin categoría",
        cantidadPedida: 0, // Esto no se modifica aquí
        cantidadFacturada: 0,
        valorPedido: 0, // Esto no se modifica aquí
        valorFacturado: 0,
        leadTimes: [],
      };

      current.cantidadFacturada += cantidadFacturada;
      current.valorFacturado += valorFacturado;

      if (factura.fecha_comp && fechaPedido) {
        const dias = Math.max(
          0,
          Math.round((new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24))
        );
        current.leadTimes.push(dias);
      }

      resumen.set(catId, current);
    }
  }

  // 🧾 4. Formato final
  return Array.from(resumen.entries())
    .filter(([_, data]) => data.cantidadFacturada > 0) // Si la cantidad facturada es 0, no mostrar la fila.
    .map(([catId, data]) => {
      const fillRate = data.cantidadPedida > 0
        ? toFixed(Math.min(data.cantidadFacturada / data.cantidadPedida, 1) * 100)
        : 0;

      const fillRatePonderado = data.valorPedido > 0
        ? toFixed(Math.min(data.valorFacturado / data.valorPedido, 1) * 100)
        : 0;

      const leadTimePromedio = data.leadTimes.length > 0
        ? toFixed(data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length)
        : null;

      return {
        categoriaId: catId,
        categoriaNombre: data.nombre,
        cantidadPedida: toFixed(data.cantidadPedida),
        cantidadFacturada: toFixed(data.cantidadFacturada),
        totalPedido: toFixed(data.valorPedido),
        totalFacturado: toFixed(data.valorFacturado),
        fillRate,
        fillRatePonderado,
        leadTimePromedio,
      };
    })
    .sort((a, b) => a.categoriaNombre.localeCompare(b.categoriaNombre));
}