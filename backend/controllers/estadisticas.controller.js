import { Pedido, DetallePedido, Producto, Cliente, Usuario, Categoria, ImagenProducto, LogCliente, PedidoDux, PersonalDux } from '../models/index.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { Op, fn, col, literal, QueryTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import dayjs from 'dayjs';
//import cache from '../utils/cache.js';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';
import { getLocalKpis } from '../helpers/estadisticas/local.js';
import { getDuxKpis } from '../helpers/estadisticas/dux.js';
import { pickTop } from '../helpers/estadisticas/common.js';

export const obtenerResumenEstadisticas = async (req, res, next) => {
  try {
    const inicioMes = dayjs().startOf('month').toDate();
    const finMes    = dayjs().endOf('month').toDate();
    const idVendedor = await resolverIdVendedor(req);

    // LOCAL
    const local = await getLocalKpis({ inicioMes, finMes, req });

    // DUX
    const dux = await getDuxKpis({ inicioMes, finMes, idVendedor });

    // Top vendedor combinado para la tarjeta "Vendedor top del mes"
    const vendedorTop = pickTop(local.vendedorTopLocalNorm, dux.vendedorTopDuxNorm);

    // “Mejores clientes” (si querés mantener el comportamiento anterior de fallback)
    const mejoresClientes =
      local.clientesTopMontoLocal?.length
        ? local.clientesTopMontoLocal
        : dux.clientesTopMontoDux;

    res.json({
      // Totales combinados
      totalPedidos: Number(local.totalPedidosLocal || 0) + Number(dux.totalPedidosDux || 0),
      totalFacturado: Number(local.totalFacturadoLocal || 0) + Number(dux.totalFacturadoDux || 0),

      // Por origen
      totalPedidosLocal: Number(local.totalPedidosLocal || 0),
      totalPedidosDux: Number(dux.totalPedidosDux || 0),
      totalFacturadoLocal: Number(local.totalFacturadoLocal || 0),
      totalFacturadoDux: Number(dux.totalFacturadoDux || 0),

      // Tarjetas existentes (top 1)
      productoEstrella: local.productoEstrella,
      categoriaTop: local.categoriaTopLocal,
      vendedorTop,
      mejoresClientes,

      // -------- NUEVOS: RANKINGS TOP 5 (por cantidad y por facturación) --------
      rankings: {
        productos: {
          local: {
            porCantidad: local.productosTopCantLocal,
            porMonto:    local.productosTopMontoLocal,
          },
          dux: {
            porCantidad: dux.productosTopCantDux,
            porMonto:    dux.productosTopMontoDux,
          },
        },
        vendedores: {
          local: {
            porCantidad: local.vendedoresTopCantLocal,
            porMonto:    local.vendedoresTopMontoLocal,
          },
          dux: {
            porCantidad: dux.vendedoresTopCantDux,
            porMonto:    dux.vendedoresTopMontoDux,
          },
        },
        categorias: {
          local: {
            porCantidad: local.categoriasTopCantLocal,
            porMonto:    local.categoriasTopMontoLocal,
          },
          dux: {
            porCantidad: dux.categoriasTopCantDux,
            porMonto:    dux.categoriasTopMontoDux,
          },
        },
        clientes: {
          local: {
            porCantidad: local.clientesTopCantLocal,
            porMonto:    local.clientesTopMontoLocal,
          },
          dux: {
            porCantidad: dux.clientesTopCantDux,
            porMonto:    dux.clientesTopMontoDux,
          },
        },
      },
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
        include: [{ model: Producto, as: 'producto', attributes: ['nombre'], required: true }],
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

    const productos = await DetallePedido.findAll({
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'cantidadVendida'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
      ],
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'], required: true }],
      where: whereFecha,
      group: ['productoId'],
      order: [[literal('cantidadVendida'), 'DESC']],
      limit: 10,
    });

    const vendedores = await Pedido.findAll({
      attributes: [
        'usuarioId',
        [fn('COUNT', col('Pedido.id')), 'totalPedidos'],
        [fn('SUM', col('total')), 'totalFacturado'],
      ],
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
      where: whereFecha,
      group: ['usuarioId'],
      order: [[literal('totalFacturado'), 'DESC']],
      limit: 10,
    });

    const clientes = await Pedido.findAll({
      attributes: [
        'clienteId',
        [fn('COUNT', col('Pedido.id')), 'cantidadPedidos'],
        [fn('SUM', col('total')), 'totalGastado'],
      ],
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
      where: whereFecha,
      group: ['clienteId'],
      order: [[literal('totalGastado'), 'DESC']],
      limit: 10,
    });

    const categorias = await DetallePedido.findAll({
      attributes: [
        [col('producto.categoriaId'), 'categoriaId'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
        [col('producto.Categoria.nombre'), 'nombre'],
      ],
      include: [{
        model: Producto,
        as: 'producto', // alias correcto
        attributes: [],
        include: [{
          model: Categoria,
          as: 'Categoria', // alias correcto
          attributes: [],
        }],
        required: true,
      }],
      where: whereFecha,
      group: ['producto.categoriaId'],
      order: [[literal('totalFacturado'), 'DESC']],
      limit: 10,
      raw: true,
    });


    res.json({ productos, vendedores, clientes, categorias });
  } catch (error) {
    console.error('❌ Error en estadísticas ranking:', error);
    next(error);
  }
};

export const obtenerEstadisticasProducto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [ventas, unidadesVendidas, facturacion, visitas] = await Promise.all([
      Pedido.count({
        include: [{ model: DetallePedido, as: 'detalles', where: { productoId: id }, required: true }],
      }),
      DetallePedido.sum('cantidad', { where: { productoId: id } }),
      DetallePedido.sum('subtotal', { where: { productoId: id } }),
      LogCliente.count({ where: { busqueda: `detalle:${id}` } }),
    ]);

    res.json({
      ventas: ventas || 0,
      unidadesVendidas: unidadesVendidas || 0,
      facturacion: facturacion || 0,
      visitas: visitas || 0,
    });
  } catch (error) {
    console.error('❌ Error en obtenerEstadisticasProducto:', error);
    next(error);
  }
};

export const obtenerVentasPorCategoria = async (req, res) => {
  try {
    const resultados = await DetallePedido.findAll({
      attributes: [
        [fn('SUM', col('subtotal')), 'totalVentas'],
        [col('producto.Categoria.nombre'), 'categoria'],
      ],
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: [],
          include: [{
            model: Categoria,
            as: 'Categoria', // correcto según tu modelo
            attributes: [],
          }],
          required: true,
        }
      ],
      where: { deletedAt: null },
      group: ['producto.Categoria.nombre'],
      raw: true,
    });

    const datos = resultados.map(item => ({
      categoria: item.categoria,
      totalVentas: Number(item.totalVentas),
    }));

    res.json(datos);
  } catch (error) {
    console.error("❌ Error al obtener ventas por categoría", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerPedidosPorMesConVendedor = async (req, res) => {
  try {
    const { desde, hasta, vendedor } = req.query;

    // ⏱️ Rango de fechas
    const whereFecha = {};
    if (desde && hasta) {
      whereFecha.fecha = {
        [Op.between]: [new Date(desde + "T00:00:00"), new Date(hasta + "T23:59:59")],
      };
    }

    // 🧑‍💼 Resolver vendedor: prioridad querystring > logueado
    let idVendedor = null;
    if (vendedor) {
      const encontrado = await PersonalDux.findOne({
        attributes: ["id_personal"],
        where: Sequelize.where(
          Sequelize.fn(
            "CONCAT",
            Sequelize.col("apellido_razon_social"),
            ", ",
            Sequelize.col("nombre")
          ),
          vendedor
        ),
        raw: true,
      });
      idVendedor = encontrado?.id_personal ?? null;
    } else {
      const idVendedorLog = await resolverIdVendedor(req);
      if (idVendedorLog) idVendedor = idVendedorLog;
    }

    // 📊 Agrupado por mes
    const resultados = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("fecha"), "%Y-%m"), "mes"],
        [Sequelize.fn("COUNT", Sequelize.col("PedidoDux.id")), "totalPedidos"],
        [
          Sequelize.literal(`SUM(
            CASE WHEN EXISTS (
              SELECT 1 FROM Facturas f
              WHERE f.nro_pedido = PedidoDux.id
              ${idVendedor ? `AND f.id_vendedor = ${idVendedor}` : ""}
            ) THEN 1 ELSE 0 END
          )`),
          "pedidosVendedor",
        ],
      ],
      where: whereFecha,
      group: ["mes"],
      order: [["mes", "ASC"]],
      raw: true,
    });

    res.json(resultados);
  } catch (error) {
    console.error("❌ Error en obtenerPedidosPorMesConVendedor:", error);
    res.status(500).json({ error: "Error al obtener los pedidos" });
  }
};


