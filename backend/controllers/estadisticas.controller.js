import { Pedido, DetallePedido, Producto, Cliente, Usuario, Categoria, ImagenProducto, LogCliente, PedidoDux, PersonalDux } from '../models/index.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { Op, fn, col, literal, QueryTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import dayjs from 'dayjs';
//import cache from '../utils/cache.js';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';

export const obtenerResumenEstadisticas = async (req, res, next) => {
  try {
    const inicioMes = dayjs().startOf('month').toDate();
    const finMes = dayjs().endOf('month').toDate();

    //const cacheKey = `resumenEstadisticas_${req.usuario?.id ?? 'anon'}_${dayjs().format('YYYY_MM')}`;
    //const cached = cache.get(cacheKey);
    //if (cached) return res.json(cached);

    // -------------------------
    // 1) LOCAL (Pedidos propios)
    // -------------------------
    const wherePedidos = { createdAt: { [Op.between]: [inicioMes, finMes] } };
    if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      // en local filtrás por usuarioId
      wherePedidos.usuarioId = req.usuario.id;
    }

    const [totalPedidosLocal, totalFacturadoLocal] = await Promise.all([
      Pedido.count({ where: wherePedidos }),
      Pedido.sum('total', { where: wherePedidos }),
    ]);

    // Producto estrella (LOCAL)
    const productoTop = await DetallePedido.findOne({
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'totalVendidas'],
        [fn('SUM', col('subtotal')), 'totalFacturado'],
      ],
      include: [{ model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] }],
      group: ['productoId'],
      order: [[literal('totalVendidas'), 'DESC']],
      raw: true,
    });

    let productoEstrella = null;
    if (productoTop) {
      const producto = await Producto.findByPk(productoTop.productoId, {
        include: [{ model: ImagenProducto, as: 'Imagenes', attributes: ['url'], required: false }],
        attributes: ['id', 'nombre'],
        paranoid: false,
      });

      productoEstrella = {
        productoId: productoTop.productoId,
        totalVendidas: Number(productoTop.totalVendidas),
        totalFacturado: Number(productoTop.totalFacturado),
        Producto: {
          nombre: producto?.nombre || null,
          imagenUrl: Array.isArray(producto?.Imagenes) ? producto.Imagenes[0]?.url || null : null,
        },
      };
    }

    // Vendedor top (LOCAL)
    const vendedorTopLocal = await Pedido.findOne({
      attributes: [
        'usuarioId',
        [fn('COUNT', col('Pedido.id')), 'cantidad'],
        [fn('SUM', col('Pedido.total')), 'totalFacturado'],
      ],
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
      where: wherePedidos,
      group: ['usuarioId'],
      order: [[literal('cantidad'), 'DESC']],
      limit: 1,
      raw: true,
      nest: true,
    });

    // Mejores clientes (LOCAL)
    const mejoresClientesLocal = await Pedido.findAll({
      attributes: ['clienteId', [fn('SUM', col('total')), 'totalGastado']],
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
      where: wherePedidos,
      group: ['clienteId'],
      order: [[literal('totalGastado'), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    // Categoría top (LOCAL)
    const categoriaTop = await DetallePedido.findOne({
      attributes: [[col('producto.categoriaId'), 'categoriaId'], [fn('SUM', col('subtotal')), 'totalFacturado']],
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: [],
          include: [{ model: Categoria, as: 'Categoria', attributes: ['nombre'], required: true }],
          required: true,
        },
        { model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] },
      ],
      group: ['producto.categoriaId'],
      order: [[literal('totalFacturado'), 'DESC']],
      raw: true,
      nest: true,
    });

    // -------------------------
    // 2) DUX (PedidosDux)
    // -------------------------
    // id_personal a filtrar (si corresponde, según login o query)
    const idVendedor = await resolverIdVendedor(req);

    const baseFromJoin = `
      FROM PedidosDux p
      LEFT JOIN (
        SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
        FROM Facturas f
        GROUP BY f.nro_pedido
      ) fx ON fx.nro_pedido = p.nro_pedido
      LEFT JOIN ClientesDux c ON c.cliente = p.cliente
      WHERE p.fecha BETWEEN :inicioMes AND :finMes
        AND (:idVendedor IS NULL OR COALESCE(fx.id_vendedor, c.vendedorId) = :idVendedor)
    `;

    // Parser robusto de total Dux (string tipo "$ 1.234,56")
    const TOTAL_DUX = `CAST(REPLACE(REPLACE(REPLACE(REPLACE(p.total, 'AR$', ''), '$', ''), '.', ''), ',', '.') AS DECIMAL(18,2))`;

    // Totales DUX
    const duxAgg = await sequelize.query(
      `
      SELECT
        COUNT(*) AS cantidad,
        COALESCE(SUM(${TOTAL_DUX}), 0) AS total
      ${baseFromJoin}
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { inicioMes, finMes, idVendedor },
      }
    );
    const totalPedidosDux = Number(duxAgg[0]?.cantidad ?? 0);
    const totalFacturadoDux = Number(duxAgg[0]?.total ?? 0);

    // Vendedor top DUX
    const vendedorTopDuxRows = await sequelize.query(
      `
      SELECT
        t.vendedorId,
        COUNT(*) AS cantidad,
        COALESCE(SUM(t.total_num), 0) AS totalFacturado
      FROM (
        SELECT
          COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId,
          CAST(
            REPLACE(REPLACE(REPLACE(REPLACE(p.total, 'AR$', ''), '$', ''), '.', ''), ',', '.')
            AS DECIMAL(18,2)
          ) AS total_num
        ${baseFromJoin}
      ) AS t
      GROUP BY t.vendedorId
      ORDER BY cantidad DESC
      LIMIT 1
      `,
      { type: QueryTypes.SELECT, replacements: { inicioMes, finMes, idVendedor } }
    );

    let vendedorTopDux = null;
    if (vendedorTopDuxRows.length && vendedorTopDuxRows[0].vendedorId) {
      const v = vendedorTopDuxRows[0];
      // opcional: traer nombre/apellido
      const nombreRow = await sequelize.query(
        `
        SELECT nombre, apellido_razon_social
        FROM PersonalDux
        WHERE id_personal = :vid
        LIMIT 1
        `,
        { type: QueryTypes.SELECT, replacements: { vid: v.vendedorId } }
      );
      vendedorTopDux = {
        vendedorId: v.vendedorId,
        cantidad: Number(v.cantidad),
        totalFacturado: Number(v.totalFacturado),
        nombre: nombreRow[0]?.nombre ?? null,
        apellido_razon_social: nombreRow[0]?.apellido_razon_social ?? null,
      };
    }

    // Mejores clientes DUX (por nombre de cliente)
    const mejoresClientesDux = await sequelize.query(
      `
      SELECT
        p.cliente AS nombre,
        COALESCE(SUM(${TOTAL_DUX}), 0) AS totalGastado
      ${baseFromJoin}
      GROUP BY p.cliente
      ORDER BY totalGastado DESC
      LIMIT 5
      `,
      { type: QueryTypes.SELECT, replacements: { inicioMes, finMes, idVendedor } }
    );

    // ---------- Subquery para resolver vendedor por pedido (misma lógica que usamos en listados)
    const subVendedor = `
  SELECT
    p2.id,
    COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId
  FROM PedidosDux p2
  LEFT JOIN (
    SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
    FROM Facturas f
    WHERE (f.anulada_boolean IS NULL OR f.anulada_boolean = 0)
    GROUP BY f.nro_pedido
  ) fx ON fx.nro_pedido = p2.nro_pedido
  LEFT JOIN ClientesDux c ON c.cliente = p2.cliente
`;

    // ---------- Producto estrella DUX (por cantidad vendida)
    const prodStarRows = await sequelize.query(
      `
  SELECT
    d.codItem                                                     AS codItem,
    COALESCE(prod.id, 0)                                          AS productoId,
    ANY_VALUE(
  COALESCE(
    prod.nombre COLLATE utf8mb4_unicode_ci,
    d.descripcion COLLATE utf8mb4_unicode_ci
  )
)                                                               AS nombre,
    SUM(d.cantidad)                                               AS totalVendidas,
    SUM(d.subtotal)                                               AS totalFacturado,
    (
      SELECT ip.url
      FROM ImagenProductos ip
      WHERE ip.productoId = prod.id
      ORDER BY ip.id
      LIMIT 1
    )                                                             AS imagenUrl
  FROM DetallePedidosDux d
  JOIN PedidosDux p         ON p.id = d.pedidoDuxId
  LEFT JOIN (${subVendedor}) t ON t.id = p.id
  LEFT JOIN Productos prod  ON
  LOWER(TRIM(prod.sku))   COLLATE utf8mb4_unicode_ci =
  LOWER(TRIM(d.codItem))  COLLATE utf8mb4_unicode_ci
  WHERE p.fecha BETWEEN :inicioMes AND :finMes
    AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
  GROUP BY d.codItem, prod.id
  ORDER BY totalVendidas DESC
  LIMIT 1
  `,
      { type: QueryTypes.SELECT, replacements: { inicioMes, finMes, idVendedor } }
    );

    const productoEstrellaDux = prodStarRows.length
      ? {
        productoId: Number(prodStarRows[0].productoId || 0),
        totalVendidas: Number(prodStarRows[0].totalVendidas || 0),
        totalFacturado: Number(prodStarRows[0].totalFacturado || 0),
        Producto: {
          nombre: prodStarRows[0].nombre || null,
          imagenUrl: prodStarRows[0].imagenUrl || null,
        },
      }
      : null;

    // ---------- Categoría top DUX (por facturación)
    const catTopRows = await sequelize.query(
      `
  SELECT
    cat.id              AS categoriaId,
    cat.nombre          AS nombre,
    SUM(d.subtotal)     AS totalFacturado
  FROM DetallePedidosDux d
  JOIN PedidosDux p          ON p.id = d.pedidoDuxId
  LEFT JOIN (${subVendedor}) t ON t.id = p.id
  JOIN Productos prod        ON
  LOWER(TRIM(prod.sku))   COLLATE utf8mb4_unicode_ci =
  LOWER(TRIM(d.codItem))  COLLATE utf8mb4_unicode_ci
  JOIN Categorias cat        ON cat.id = prod.categoriaId
  WHERE p.fecha BETWEEN :inicioMes AND :finMes
    AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
  GROUP BY cat.id, cat.nombre
  ORDER BY totalFacturado DESC
  LIMIT 1
  `,
      { type: QueryTypes.SELECT, replacements: { inicioMes, finMes, idVendedor } }
    );

    const categoriaTopDux = catTopRows.length
      ? { nombre: catTopRows[0].nombre }
      : null;

    // --- Normalización de vendedor top (unificamos LOCAL + DUX al shape esperado por el front)
    const pickTop = (a, b) => {
      if (!a) return b;
      if (!b) return a;
      // priorizamos por totalFacturado; empate → por cantidad
      if (Number(b.totalFacturado) > Number(a.totalFacturado)) return b;
      if (Number(b.totalFacturado) < Number(a.totalFacturado)) return a;
      return Number(b.cantidad) > Number(a.cantidad) ? b : a;
    };

    const vendedorTopLocalNorm = vendedorTopLocal
      ? {
        usuarioId: vendedorTopLocal.usuarioId ?? null,
        cantidad: Number(vendedorTopLocal.cantidad ?? 0),
        totalFacturado: Number(vendedorTopLocal.totalFacturado ?? 0),
        usuario: { nombre: vendedorTopLocal.usuario?.nombre ?? "—" },
      }
      : null;

    const vendedorTopDuxNorm = vendedorTopDux
      ? {
        usuarioId: null, // no hay Usuario local asociado
        cantidad: Number(vendedorTopDux.cantidad ?? 0),
        totalFacturado: Number(vendedorTopDux.totalFacturado ?? 0),
        usuario: {
          nombre: [vendedorTopDux.apellido_razon_social, vendedorTopDux.nombre]
            .filter(Boolean)
            .join(", "),
        },
      }
      : null;

    const vendedorTop = pickTop(vendedorTopLocalNorm, vendedorTopDuxNorm);

    // --- Unificamos "mejoresClientes" (tu front lo espera así)
    const mejoresClientes =
      (mejoresClientesLocal && mejoresClientesLocal.length)
        ? mejoresClientesLocal
        : (mejoresClientesDux || []).map((r) => ({
          clienteId: 0, // Dux no tiene id local del cliente
          totalGastado: Number(r.totalGastado ?? 0),
          cliente: { nombre: r.nombre ?? "—" },
        }));

    // -------------------------
    // 3) Armar respuesta combinada
    // -------------------------
    const result = {
      // Totales combinados
      totalPedidos: Number(totalPedidosLocal) + Number(totalPedidosDux),
      totalFacturado: Number(totalFacturadoLocal || 0) + Number(totalFacturadoDux || 0),

      // Totales por origen (si los usás en otro lado)
      totalPedidosLocal: Number(totalPedidosLocal || 0),
      totalPedidosDux: Number(totalPedidosDux || 0),
      totalFacturadoLocal: Number(totalFacturadoLocal || 0),
      totalFacturadoDux: Number(totalFacturadoDux || 0),

      // KPI locales que ya tenías
      productoEstrella,
      categoriaTop: categoriaTop?.producto?.Categoria ?? null,

      // KPI combinados y Dux
      vendedorTop,
      mejoresClientes,

      // 👇 NUEVOS
      productoEstrellaDux,
      categoriaTopDux,
    };

    //cache.set(cacheKey, result, 60 * 10); // 10 minutos
    res.json(result);
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

    const whereFecha = {};
    if (desde && hasta) {
      whereFecha.fecha = {
        [Op.between]: [new Date(desde + "T00:00:00"), new Date(hasta + "T23:59:59")],
      };
    }

    let idVendedor = null;
    if (vendedor) {
      const encontrado = await PersonalDux.findOne({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("apellido_razon_social"),
                ", ",
                Sequelize.col("nombre")
              ),
              vendedor
            ),
          ],
        },
      });

      if (encontrado) {
        idVendedor = encontrado.id_personal;
      }
    }

    const resultados = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("fecha"), "%Y-%m"), "mes"],
        [Sequelize.fn("COUNT", Sequelize.col("PedidoDux.id")), "totalPedidos"],
        [
          Sequelize.literal(`SUM(
            EXISTS (
              SELECT 1 FROM Facturas f
              WHERE f.nro_pedido = PedidoDux.id
              ${idVendedor ? `AND f.id_vendedor = ${idVendedor}` : ""}
            )
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


