// backend/utils/eficiencia/dbQueries.js
import { Op, fn, col, where } from 'sequelize';
import { Factura, DetalleFactura, PedidoDux, DetallePedidoDux, Categoria, Producto } from '../../models/index.js'; // Ajusta la ruta

/*** 🔍 Trae facturas con detalles.
 * @param {Date | null} desde - Fecha de inicio del rango (opcional).
 * @param {Date | null} hasta - Fecha de fin del rango (opcional).
 * @param {number | number[] | null} nroPedidos - Un número de pedido o un array de números de pedido (opcional).
 * @returns {Promise<Array<Factura>>} Lista de facturas.
 */
export async function obtenerFacturasConDetallesEnRango(desde = null, hasta = null, nroPedidos = null) {
  const whereConditions = {
    anulada_boolean: false,
    tipo_comp: {
      [Op.in]: ["FACTURA", "COMPROBANTE_VENTA", "NOTA_DEBITO", "FACTURA_FCE_MIPYMES"]
    }
  };

  if (nroPedidos !== null) { // Si se proporcionan números de pedido, priorizar esta búsqueda
    if (Array.isArray(nroPedidos)) {
        whereConditions.nro_pedido = { [Op.in]: nroPedidos.map(n => Number(n)).filter(n => !isNaN(n)) };
    } else {
        whereConditions.nro_pedido = Number(nroPedidos);
    }
    // Si se busca por nro_pedido, no se aplica el filtro de fecha aquí para obtener el historial completo.
  } else if (desde && hasta) { // Si no hay nroPedidos, usar el rango de fechas
    whereConditions.fecha_comp = { [Op.between]: [desde, hasta] };
  } else {
    // Si no se proporciona ningún criterio, se devuelve vacío para evitar consultas masivas.
    console.warn("obtenerFacturasConDetallesEnRango llamada sin criterios. Devolviendo vacío.");
    return [];
  }

  try {
    const facturas = await Factura.findAll({
      where: whereConditions,
      include: [{
        model: DetalleFactura,
        as: 'detalles',
        attributes: ['id', 'codItem', 'cantidad', 'descripcion', 'precioUnitario']
      }]
    });
    return facturas;
  } catch (error) {
    console.error("Error al obtener facturas con detalles:", error);
    throw error; // Propagar el error
  }
}

/*** 🔍 Trae pedidos por un array de números de pedido.
 * @param {Array<string | number>} nros - Array de números de pedido.
 * @returns {Promise<Array<PedidoDux>>} Lista de pedidos.
 */
export async function obtenerPedidosPorNro(nros) {
  const nrosNumericos = nros.map(n => Number(n)).filter(n => !isNaN(n));
  if (nrosNumericos.length === 0) return [];
  return await PedidoDux.findAll({
    where: { nro_pedido: { [Op.in]: nrosNumericos } },
    attributes: ['id', 'nro_pedido', 'fecha', 'cliente'],
  });
}

/*** 🔍 Trae detalles de pedidos por un array de IDs de pedido.
 * @param {Array<number>} pedidosId - Array de IDs de pedido.
 * @returns {Promise<Array<DetallePedidoDux>>} Lista de detalles de pedido.
 */
export async function obtenerDetallesPedidosPorId(pedidosId) {
  if (pedidosId.length === 0) return [];
  return await DetallePedidoDux.findAll({
    where: { pedidoDuxId: { [Op.in]: pedidosId } },
    attributes: ['id', 'pedidoDuxId', 'codItem', 'cantidad', 'descripcion', 'precioUnitario']
  });
}

/*** 🔍 Trae todas las categorías que no contengan "producción".
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

/*** 🔍 Trae productos con categoría ID para SKU específicos.
 * @param {Array<string>} skus - SKUs a buscar.
 * @returns {Promise<Array<Producto>>} Lista de productos.
 */
export async function obtenerProductosPorSkusYCategoria(skus) {
    if (skus.length === 0) return [];
    return await Producto.findAll({
        where: {
            sku: { [Op.in]: skus },
            categoriaId: { [Op.ne]: null }
        },
        attributes: ['sku', 'categoriaId']
    });
}