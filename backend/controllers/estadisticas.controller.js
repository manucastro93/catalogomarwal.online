import { Pedido, DetallePedido, Producto, Cliente, Usuario, Categoria, ImagenProducto } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
import dayjs from 'dayjs';

export const obtenerResumenEstadisticas = async (req, res, next) => {
  try {
    const inicioMes = dayjs().startOf('month').toDate();
    const finMes = dayjs().endOf('month').toDate();

    // Total de pedidos
    const totalPedidos = await Pedido.count({
      where: {
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
    });

    const totalFacturado = await Pedido.sum('total', {
      where: {
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
    });

    // Producto más vendido (paso 1)
    const productoTop = await DetallePedido.findOne({
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'totalVendidas'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
      ],
      where: {
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
      group: ['productoId'],
      order: [[literal('totalVendidas'), 'DESC']],
      raw: true,
    });

    // Producto más vendido (paso 2)
    let productoEstrella = null;
    if (productoTop) {
      const producto = await Producto.findByPk(productoTop.productoId, {
        include: [
          {
            model: ImagenProducto,
            as: 'Imagenes',
            attributes: ['url'],
            required: false,
          },
        ],
        attributes: ['id', 'nombre'],
      });

      productoEstrella = {
        productoId: productoTop.productoId,
        totalVendidas: Number(productoTop.totalVendidas),
        totalFacturado: Number(productoTop.totalFacturado),
        Producto: {
          nombre: producto?.nombre,
          imagenUrl: Array.isArray(producto?.Imagenes) ? producto.Imagenes[0]?.url || null : null,
        },
      };
    }

    // Vendedor con más ventas
    const vendedorTop = await Pedido.findOne({
      attributes: [
        'usuarioId',
        [fn('COUNT', col('Pedido.id')), 'cantidad'], // especificar la tabla
        [fn('SUM', col('Pedido.total')), 'totalFacturado'],
      ],
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
      where: {
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
      group: ['usuarioId'],
      order: [[literal('cantidad'), 'DESC']],
      limit: 1,
    });

    // Top 5 clientes por facturación
    const mejoresClientes = await Pedido.findAll({
      attributes: [
        'clienteId',
        [fn('SUM', col('total')), 'totalGastado'],
      ],
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
      where: {
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
      group: ['clienteId'],
      order: [[literal('totalGastado'), 'DESC']],
      limit: 5,
    });

        // Categoría más vendida
        const categoriaTop = await DetallePedido.findOne({
          attributes: [
            [col('Producto.categoriaId'), 'categoriaId'],
            [fn('SUM', col('subtotal')), 'totalFacturado']
          ],
          include: [{
            model: Producto,
            attributes: [],
            include: [{
              model: Categoria,
              as: 'Categoria',
              attributes: ['nombre']
            }]
          }],
          where: { createdAt: { [Op.between]: [inicioMes, finMes] } },
          group: ['Producto.categoriaId'],
          order: [[literal('totalFacturado'), 'DESC']],
          raw: true,
          nest: true,
        });

    res.json({
      totalPedidos,
      totalFacturado,
      productoEstrella,
      vendedorTop,
      categoriaTop: categoriaTop?.Producto?.Categoria ?? null,
      mejoresClientes,
    });
  } catch (error) {
    console.error('❌ Error en resumen de estadísticas:', error);
    next(error);
  }
};

export const obtenerEstadisticasPorFecha = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Faltan fechas desde/hasta' });
    }

    const desdeFecha = dayjs(desde).startOf('day').toDate();
    const hastaFecha = dayjs(hasta).endOf('day').toDate();

    const pedidos = await Pedido.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'fecha'],
        [fn('SUM', col('total')), 'total'],
        [fn('COUNT', col('id')), 'cantidad'],
      ],
      where: {
        createdAt: { [Op.between]: [desdeFecha, hastaFecha] },
      },
      group: [literal('DATE(createdAt)')],
      order: [[literal('fecha'), 'ASC']],
      raw: true,
    });

    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error en estadísticas por fecha:', error);
    next(error);
  }
};

export const compararRangos = async (req, res, next) => {
  try {
    const { desde1, hasta1, desde2, hasta2 } = req.query;

    if (!desde1 || !hasta1 || !desde2 || !hasta2) {
      return res.status(400).json({ message: 'Faltan fechas en alguno de los rangos' });
    }

    const rangos = [
      { desde: dayjs(desde1).startOf('day').toDate(), hasta: dayjs(hasta1).endOf('day').toDate() },
      { desde: dayjs(desde2).startOf('day').toDate(), hasta: dayjs(hasta2).endOf('day').toDate() }
    ];

    const resultados = [];

    for (const { desde, hasta } of rangos) {
      const totalPedidos = await Pedido.count({ where: { createdAt: { [Op.between]: [desde, hasta] } } });
      const totalFacturado = await Pedido.sum('total', { where: { createdAt: { [Op.between]: [desde, hasta] } } });

      const productoTop = await DetallePedido.findOne({
        attributes: [
          'productoId',
          [fn('SUM', col('cantidad')), 'cantidad'],
        ],
        include: [{ model: Producto, attributes: ['nombre'] }],
        where: { createdAt: { [Op.between]: [desde, hasta] } },
        group: ['productoId'],
        order: [[literal('cantidad'), 'DESC']],
        limit: 1,
      });

      resultados.push({ totalPedidos, totalFacturado, productoTop });
    }

    res.json({ rango1: resultados[0], rango2: resultados[1] });
  } catch (error) {
    console.error('❌ Error al comparar rangos:', error);
    next(error);
  }
};

export const obtenerRankingEstadisticas = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;

    const inicio = desde ? dayjs(desde).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const fin = hasta ? dayjs(hasta).endOf('day').toDate() : dayjs().endOf('month').toDate();

    const whereFecha = { createdAt: { [Op.between]: [inicio, fin] } };

    // Productos más vendidos
    const productos = await DetallePedido.findAll({
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'cantidadVendida'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
      ],
      include: [{ model: Producto, attributes: ['nombre'] }],
      where: whereFecha,
      group: ['productoId'],
      order: [[literal('cantidadVendida'), 'DESC']],
      limit: 10,
    });

    // Vendedores con más ventas
    const vendedores = await Pedido.findAll({
      attributes: [
        'usuarioId',
        [fn('COUNT', col('id')), 'totalPedidos'],
        [fn('SUM', col('total')), 'totalFacturado'],
      ],
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
      where: whereFecha,
      group: ['usuarioId'],
      order: [[literal('totalFacturado'), 'DESC']],
      limit: 10,
    });

    // Clientes con mayor facturación
    const clientes = await Pedido.findAll({
      attributes: [
        'clienteId',
        [fn('COUNT', col('id')), 'cantidadPedidos'],
        [fn('SUM', col('total')), 'totalGastado'],
      ],
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
      where: whereFecha,
      group: ['clienteId'],
      order: [[literal('totalGastado'), 'DESC']],
      limit: 10,
    });

    // Categorías más facturadas (requiere join extra)
    const categorias = await DetallePedido.findAll({
      attributes: [
        [col('Producto.categoriaId'), 'categoriaId'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
      ],
      include: [{ model: Producto, attributes: [], include: [{ model: Categoria, attributes: ['nombre'] }] }],
      where: whereFecha,
      group: ['Producto.categoriaId'],
      order: [[literal('totalFacturado'), 'DESC']],
      limit: 10,
      raw: true,
      nest: true,
    });

    res.json({ productos, vendedores, clientes, categorias });
  } catch (error) {
    console.error('❌ Error en estadísticas ranking:', error);
    next(error);
  }
};