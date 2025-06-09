
import { DetallePedidoDux } from '../../models/index.js';
/*** 🗂 Mapea detalles de pedido por ID de pedido.
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

export function mapearCantidadPedidaPorItemEnPedido(detalles) {
  const map = new Map();
  for (const dp of detalles) {
    const clave = `${dp.pedidoDuxId}-${(dp.codItem || "").toLowerCase().trim()}`;
    map.set(clave, (map.get(clave) || 0) + parseFloat(dp.cantidad || 0));
  }
  return map;
}
