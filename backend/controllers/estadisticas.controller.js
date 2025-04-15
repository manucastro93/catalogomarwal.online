import { Pedido, Cliente, DetallePedido, Producto, Categoria, Usuario } from '../models/index.js';
import { Op, fn, col } from 'sequelize';

export const resumenDelMes = async (req, res, next) => {
  try {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const pedidosDelMes = await Pedido.count({
      where: { createdAt: { [Op.gte]: inicioMes } },
    });

    const productoEstrella = await DetallePedido.findOne({
      attributes: ['productoId', [fn('SUM', col('cantidad')), 'totalVendidas']],
      group: ['productoId'],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      include: [Producto],
    });

    const vendedorTop = await Usuario.findOne({
      where: { rol: 'vendedor' },
      include: [{
        model: Pedido,
        where: { createdAt: { [Op.gte]: inicioMes } },
        required: true,
      }],
      attributes: {
        include: [[fn('COUNT', col('Pedidos.id')), 'ventas']],
      },
      group: ['Usuario.id'],
      order: [[fn('COUNT', col('Pedidos.id')), 'DESC']],
    });

    const categoriaTop = await Categoria.findOne({
      include: [{
        model: Producto,
        include: [{
          model: DetallePedido,
          where: { createdAt: { [Op.gte]: inicioMes } },
          required: true,
        }],
      }],
    });

    const mejoresClientes = await Cliente.findAll({
      include: [{
        model: Pedido,
        where: { createdAt: { [Op.gte]: inicioMes } },
        required: true,
      }],
      attributes: {
        include: [[fn('SUM', col('Pedidos.total')), 'totalGastado']],
      },
      group: ['Cliente.id'],
      order: [[fn('SUM', col('Pedidos.total')), 'DESC']],
      limit: 5,
    });

    res.json({
      pedidosDelMes,
      productoEstrella,
      vendedorTop,
      categoriaTop,
      mejoresClientes,
    });
  } catch (error) {
    next(error);
  }
};
