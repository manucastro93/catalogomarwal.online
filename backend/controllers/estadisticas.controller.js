import { Pedido, DetallePedido, Producto, Cliente, Usuario, Categoria, ImagenProducto, LogCliente, PedidoDux, PersonalDux } from '../models/index.js';
import { Op, fn, col, literal, QueryTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import dayjs from 'dayjs';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';
import { getLocalKpis } from '../helpers/estadisticas/local.js';
import { getDuxKpis } from '../helpers/estadisticas/dux.js';
import { pickTop } from '../helpers/estadisticas/common.js';

const NC_TIPOS = ['NOTA_CREDITO', 'NOTA_CREDITO_FCE_MIPYMES'];
const FACT_POSITIVOS = ['FACTURA','FACTURA_FCE_MIPYMES','COMPROBANTE_VENTA'];

function rangosFechas() {
  const ahora = dayjs();

  // Mes actual (parcial)
  const inicioMesActual = ahora.startOf('month').toDate();
  const finHoy = ahora.endOf('day').toDate();

  // Mes anterior (completo)
  const inicioMesAnterior = ahora.subtract(1, 'month').startOf('month').toDate();
  const finMesAnterior = ahora.subtract(1, 'month').endOf('month').toDate();

  // Últimos 3 meses RODANTES (incluye mes actual)
  const inicio3m = ahora.subtract(3, 'month').startOf('day').toDate();

  // 12 meses rodantes
  const inicio12m = ahora.subtract(12, 'month').startOf('day').toDate();

  // 👇 3 meses previos COMPLETOS (M-3 .. M-1), EXCLUYE el mes actual
  const inicio3mPrev = ahora.subtract(3, 'month').startOf('month').toDate();
  const fin3mPrev = ahora.subtract(1, 'month').endOf('month').toDate();

  return {
    inicioMesActual, finHoy,
    inicioMesAnterior, finMesAnterior,
    inicio3m, inicio12m,
    inicio3mPrev, fin3mPrev,
  };
}

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


async function resolverVendedor(req) {
  const { vendedor, personalDuxId } = req.query || {};
  if (personalDuxId) return Number(personalDuxId);

  if (vendedor) {
    const encontrado = await PersonalDux.findOne({
      attributes: ['id_personal'],
      where: Sequelize.where(
        Sequelize.fn('CONCAT', Sequelize.col('apellido_razon_social'), ', ', Sequelize.col('nombre')),
        vendedor
      ),
      raw: true,
    });
    if (encontrado?.id_personal) return encontrado.id_personal;
  }
  const idLog = await resolverIdVendedor(req);
  return idLog || null;
}

// Construye el WHERE adicional de vendedor para inyectar en el SQL
function vendedorClause(idVendedor) {
  return idVendedor ? ` AND f.id_vendedor = ${Number(idVendedor)} ` : '';
}

// Orden permitido
const ORDER_FIELDS = new Set([
  'codigo','descripcion',
  'cant_mes_actual','monto_mes_actual',
  'cant_mes_anterior','monto_mes_anterior',
  'cant_3m','monto_3m','cant_12m','monto_12m'
]);

export const ventasPorProducto = async (req, res) => {
  try {
    const {
      q = '',
      categoriaId,
      page = 1,
      limit = 20,
      orderBy = 'monto_12m',
      orderDir = 'DESC',
    } = req.query;

    const idVendedor = await resolverVendedor(req);
    const { 
      inicioMesActual, finHoy,
      inicioMesAnterior, finMesAnterior,
      inicio3m, inicio12m,
      inicio3mPrev, fin3mPrev, // 👈 nuevo
    } = rangosFechas();

    const COLL = 'utf8mb4_general_ci';

    const buscar = String(q || '').trim();
    const filtroQ = buscar
      ? ` AND (
            p.sku COLLATE ${COLL} LIKE :like COLLATE ${COLL}
         OR p.nombre COLLATE ${COLL} LIKE :like COLLATE ${COLL}
         OR p.descripcion COLLATE ${COLL} LIKE :like COLLATE ${COLL}
        ) `
      : '';
    const filtroCategoria = categoriaId ? ` AND p.categoriaId = :categoriaId ` : '';

    const whereBase = `
      f.anulada_boolean IS NOT TRUE
      ${filtroQ}
      ${filtroCategoria}
      ${idVendedor ? vendedorClause(idVendedor) : ''}
    `;

    const signo = `CASE
      WHEN UPPER(TRIM(f.tipo_comp)) IN (${NC_TIPOS.map(t=>`'${t}'`).join(',')}) THEN -1
      ELSE 1
    END`;

    const sql = `
      SELECT
        p.id AS productoId,
        p.sku AS codigo,
        COALESCE(p.nombre, p.descripcion, '') AS descripcion,

        -- Cantidades
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicioMesActual AND :finHoy
                 THEN df.cantidad * ${signo} ELSE 0 END) AS cant_mes_actual,
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicioMesAnterior AND :finMesAnterior
                 THEN df.cantidad * ${signo} ELSE 0 END) AS cant_mes_anterior,
        SUM(CASE WHEN f.fecha_comp >= :inicio3m
                 THEN df.cantidad * ${signo} ELSE 0 END) AS cant_3m,
        SUM(CASE WHEN f.fecha_comp >= :inicio12m
                 THEN df.cantidad * ${signo} ELSE 0 END) AS cant_12m,
        -- 👇 3 meses previos completos (M-3..M-1)
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicio3mPrev AND :fin3mPrev
                 THEN df.cantidad * ${signo} ELSE 0 END) AS cant_3m_prev,

        -- Montos (neto de IVA: df.subtotal ya viene neto)
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicioMesActual AND :finHoy
                 THEN df.subtotal * ${signo} ELSE 0 END) AS monto_mes_actual,
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicioMesAnterior AND :finMesAnterior
                 THEN df.subtotal * ${signo} ELSE 0 END) AS monto_mes_anterior,
        SUM(CASE WHEN f.fecha_comp >= :inicio3m
                 THEN df.subtotal * ${signo} ELSE 0 END) AS monto_3m,
        SUM(CASE WHEN f.fecha_comp >= :inicio12m
                 THEN df.subtotal * ${signo} ELSE 0 END) AS monto_12m,
        -- 👇 3 meses previos completos (M-3..M-1)
        SUM(CASE WHEN f.fecha_comp BETWEEN :inicio3mPrev AND :fin3mPrev
                 THEN df.subtotal * ${signo} ELSE 0 END) AS monto_3m_prev

      FROM DetalleFacturas df
      JOIN Facturas f       ON f.id = df.facturaId
      JOIN Productos p      ON (p.sku COLLATE ${COLL}) = (df.codItem COLLATE ${COLL})
      LEFT JOIN Categorias c ON c.id = p.categoriaId
      WHERE ${whereBase}
      GROUP BY p.id, p.sku, p.nombre, p.descripcion
    `;

    const sqlCount = `
      SELECT COUNT(*) AS total
      FROM (${sql}) AS t
    `;

    const ORDER_FIELDS = new Set([
      'codigo','descripcion',
      'cant_mes_actual','monto_mes_actual',
      'cant_mes_anterior','monto_mes_anterior',
      'cant_3m','monto_3m','cant_12m','monto_12m'
    ]);

    const safeOrderBy = ORDER_FIELDS.has(String(orderBy)) ? String(orderBy) : 'monto_12m';
    const safeOrderDir = String(orderDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (Number(page) - 1) * Number(limit);

    const replacements = {
      like: `%${buscar}%`,
      categoriaId: categoriaId ? Number(categoriaId) : null,
      inicioMesActual, finHoy, inicioMesAnterior, finMesAnterior, inicio3m, inicio12m,
      inicio3mPrev, fin3mPrev, // 👈 nuevo
    };

    const [{ total }] = await sequelize.query(sqlCount, {
      type: Sequelize.QueryTypes.SELECT,
      replacements,
    });

    const rows = await sequelize.query(
      `${sql} ORDER BY ${safeOrderBy} ${safeOrderDir} LIMIT :limit OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limit: Number(limit), offset },
      }
    );

    const totalFilas = Number(total || 0);
    const totalPaginas = Math.max(1, Math.ceil(totalFilas / Number(limit)));

    res.json({
      data: rows.map(r => ({
        productoId: Number(r.productoId),
        codigo: r.codigo,
        descripcion: r.descripcion,
        cant_mes_actual: Number(r.cant_mes_actual || 0),
        monto_mes_actual: Number(r.monto_mes_actual || 0),
        cant_mes_anterior: Number(r.cant_mes_anterior || 0),
        monto_mes_anterior: Number(r.monto_mes_anterior || 0),
        cant_3m: Number(r.cant_3m || 0),
        monto_3m: Number(r.monto_3m || 0),
        cant_12m: Number(r.cant_12m || 0),
        monto_12m: Number(r.monto_12m || 0),
        cant_3m_prev: Number(r.cant_3m_prev || 0),
        monto_3m_prev: Number(r.monto_3m_prev || 0),
      })),
      pagina: Number(page),
      totalPaginas,
    });
  } catch (error) {
    console.error('❌ Error en ventasPorProducto:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};

export const ventasPorProductoResumen = async (req, res) => {
  try {
    // Forzamos consulta base consistente
    req.query.page = '1';
    req.query.limit = '2000';
    req.query.orderBy = 'monto_12m';
    req.query.orderDir = 'DESC';

    // Fake res compatible con .status().json()
    const fakeRes = {
      statusCode: 200,
      jsonPayload: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.jsonPayload = payload; return this; }
    };

    await ventasPorProducto(req, fakeRes);
    if (fakeRes.statusCode !== 200 || !fakeRes.jsonPayload) {
      return res.status(500).json({ message: 'Error interno' });
    }

    const items = fakeRes.jsonPayload.data || [];

    // ---------- Métricas auxiliares para normalizar mes parcial ----------
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();         // 0..11
    const diasTranscurridosMesActual = now.getDate();
    const diasTotalesMesActual = new Date(y, m + 1, 0).getDate();
    const fechaMesAnterior = new Date(y, m, 0);              // último día del mes anterior
    const diasTotalesMesAnterior = fechaMesAnterior.getDate();

    // ---------- Rankings base ----------
    const top12m = [...items]
      .sort((a, b) => b.monto_12m - a.monto_12m)
      .slice(0, 10);

    // Crecimiento normalizado: (promedio diario actual vs promedio diario último mes)
    const crecimientoUltimoMes = items
      .map(p => {
        const promDiaActual = (p.monto_mes_actual || 0) / Math.max(1, diasTranscurridosMesActual);
        const promDiaMesAnterior = (p.monto_mes_anterior || 0) / Math.max(1, diasTotalesMesAnterior);
        const delta = promDiaMesAnterior === 0
          ? (promDiaActual > 0 ? 100 : 0)
          : ((promDiaActual - promDiaMesAnterior) / promDiaMesAnterior) * 100;
        return { ...p, variacion_mes: delta };
      })
      .sort((a, b) => b.variacion_mes - a.variacion_mes)
      .slice(0, 10);

// ---------- Tendencia inteligente (alza/baja) ----------
// Baseline robusto = 60% (promedio 3 meses previos completos) + 40% (promedio 12m).
// Clasificación: sube si delta_$ > +15% **y** delta_cant > +15%.
//                baja si delta_$ < -15% **y** delta_cant < -15%.
//                si no, estable.
// Evita sesgo por mes parcial usando mensualizado del mes actual.

const TH = 0.15; // umbral 15%

const tendenciaCalc = items.map(p => {
  const now = new Date();
  const diasTranscurridosMesActual = now.getDate();

  // Mensualizado actual ($ y cant)
  const curMontoMens = ((p.monto_mes_actual || 0) / Math.max(1, diasTranscurridosMesActual)) * 30;
  const curCantMens  = ((p.cant_mes_actual  || 0) / Math.max(1, diasTranscurridosMesActual)) * 30;

  // Baselines ($ y cant)
  const base3mMonto = (p.monto_3m_prev || 0) / 3; // 3 meses previos COMPLETOS
  const base3mCant  = (p.cant_3m_prev  || 0) / 3;

  const base12Monto = (p.monto_12m || 0) / 12;
  const base12Cant  = (p.cant_12m  || 0) / 12;

  const baseMonto = 0.6 * base3mMonto + 0.4 * base12Monto;
  const baseCant  = 0.6 * base3mCant  + 0.4 * base12Cant;

  // Deltas relativos
  const dMonto = baseMonto === 0 ? (curMontoMens > 0 ? 1 : 0) : (curMontoMens - baseMonto) / baseMonto;
  const dCant  = baseCant  === 0 ? (curCantMens  > 0 ? 1 : 0) : (curCantMens  - baseCant)  / baseCant;

  let estado = 'estable';
  if (dMonto > TH && dCant > TH) estado = 'sube';
  else if (dMonto < -TH && dCant < -TH) estado = 'baja';

  // puntaje mixto para ordenar y mostrar %
  const delta_pct_mixto = 100 * ((dMonto + dCant) / 2);

  return { ...p, estado, delta_vs_prom3m: delta_pct_mixto };
});

const enAlza = tendenciaCalc.filter(t => t.estado === 'sube')
  .sort((a,b)=>b.delta_vs_prom3m - a.delta_vs_prom3m)
  .slice(0,10);

const enBaja = tendenciaCalc.filter(t => t.estado === 'baja')
  .sort((a,b)=>a.delta_vs_prom3m - b.delta_vs_prom3m) // más negativa primero
  .slice(0,10);

    // Proyección 30 días: pondero (mes actual mensualizado 0.5, último mes 0.3, promedio 3m 0.2)
    const proyeccion30d = items
  .map(p => {
    // MONTO
    const mensualizadoActualMonto =
      ((p.monto_mes_actual || 0) / Math.max(1, diasTranscurridosMesActual)) * 30;
    const prom3mMonto = (p.monto_3m || 0) / 3;
    const projMonto = (mensualizadoActualMonto * 0.5) + (p.monto_mes_anterior * 0.3) + (prom3mMonto * 0.2);

    // CANTIDAD
    const mensualizadoActualCant =
      ((p.cant_mes_actual || 0) / Math.max(1, diasTranscurridosMesActual)) * 30;
    const prom3mCant = (p.cant_3m || 0) / 3;
    const projCant = (mensualizadoActualCant * 0.5) + (p.cant_mes_anterior * 0.3) + (prom3mCant * 0.2);

    return {
      codigo: p.codigo,
      descripcion: p.descripcion,
      monto_proyectado_30d: Math.max(0, Math.round(projMonto)),
      cant_proyectada_30d: Math.max(0, Math.round(projCant)),
    };
  })
  .sort((a,b)=>b.monto_proyectado_30d - a.monto_proyectado_30d) // orden principal por $ (podés cambiar a gusto)
  .slice(0, 10);

    // Oportunidades: 12m>0 y 3m=0
    const oportunidades = items
      .filter(p => (p.monto_3m || 0) === 0 && (p.monto_12m || 0) > 0)
      .slice(0, 10)
      .map(p => ({ codigo: p.codigo, descripcion: p.descripcion, monto_12m: p.monto_12m }));

    // ---------- Redacción ejecutiva ----------
    const total12m = items.reduce((acc, p) => acc + (p.monto_12m || 0), 0);
    const totalMesAnterior = items.reduce((acc, p) => acc + (p.monto_mes_anterior || 0), 0);
    const totalMesActualMensualizado =
      ((items.reduce((acc, p) => acc + (p.monto_mes_actual || 0), 0) / Math.max(1, diasTranscurridosMesActual)) * 30);

    const variacionMensualizada = totalMesAnterior === 0
      ? (totalMesActualMensualizado > 0 ? 100 : 0)
      : ((totalMesActualMensualizado - totalMesAnterior) / totalMesAnterior) * 100;

    // ---------- Redacción ejecutiva (PRO) ----------
const fmt = (n) => Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS'}).format(n || 0);
const topProj = [...proyeccion30d].slice(0,3);
const topProjCant = [...proyeccion30d].sort((a,b)=>b.cant_proyectada_30d-a.cant_proyectada_30d).slice(0,3);

const texto =
`Visión general
• Ingresos últimos 12 meses: **${fmt(total12m)}**.
• Ritmo mensual *mensualizado*: **${fmt(totalMesActualMensualizado)}**, vs último mes **${fmt(totalMesAnterior)}** (**${variacionMensualizada >= 0 ? '↑' : '↓'} ${variacionMensualizada.toFixed(1)}%**).

Producto líder
• ${top12m[0] ? `${top12m[0].codigo} – ${top12m[0].descripcion} (${fmt(top12m[0].monto_12m)} en 12m).` : "s/d."}

Tendencias
• En alza: <br> ${enAlza.slice(0,3).map(p=>`- ${p.codigo} ${p.descripcion}`).join('<br> ') || "s/d"}.
• En baja: <br> ${enBaja.slice(0,3).map(p=>`- ${p.codigo} ${p.descripcion}`).join('<br>') || "s/d"}.

Proyección próximos 30 días
• Top proyectados: ${topProjCant.map(p=>`${p.codigo} (${p.cant_proyectada_30d} u.)`).join(', ') || "s/d"}.
• Sugerencia: priorizar visibilidad y reposición de estos SKUs.

Oportunidades/Riesgos
• SKUs sin ventas en 3m pero con 12m>0: ${oportunidades.slice(0,5).map(o=>o.codigo).join(', ') || "ninguno"}.
• Acción: revisar pricing, stock y activación comercial en clientes clave.`;

    res.json({
      top12m,
      crecimientoUltimoMes,
      enAlza,
      enBaja,
      proyeccion30d,
      oportunidades,
      meta: {
        diasTranscurridosMesActual,
        diasTotalesMesActual,
        diasTotalesMesAnterior,
        total12m,
        totalMesAnterior,
        totalMesActualMensualizado,
        variacionMensualizada
      },
      texto // 👈 texto redactado listo para mostrar
    });
  } catch (error) {
    console.error('❌ Error en ventasPorProductoResumen:', error);
    res.status(500).json({ message: 'Error interno' });
  }
};
