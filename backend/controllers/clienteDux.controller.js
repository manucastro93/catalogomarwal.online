import { ClienteDux, PedidoDux, PersonalDux, sequelize } from '../models/index.js';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import dayjs from "dayjs";
import { formatearFechaCorta } from '../utils/fecha.js'
import { geocodificarClienteDuxFila } from '../helpers/normalizarDireccion.js'
import fetch from 'node-fetch';
import pLimit from 'p-limit'; 
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';

export const reporteEjecutivoUltimaCompra = async (req, res) => {
  try {
    const hoy = dayjs().format('YYYY-MM-DD');
    const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');

    // 🔐 vendedor (param > logueado)
    const { vendedor } = req.query;
    let idVendedor = null;
    if (vendedor) {
      const encontrado = await PersonalDux.findOne({
        attributes: ['id_personal'],
        where: Sequelize.where(
          Sequelize.fn('CONCAT', Sequelize.col('apellido_razon_social'), ', ', Sequelize.col('nombre')),
          vendedor
        ),
        raw: true,
      });
      idVendedor = encontrado?.id_personal ?? null;
    }
    if (!idVendedor) {
      const idVendedorLog = await resolverIdVendedor(req);
      if (idVendedorLog) idVendedor = idVendedorLog;
    }

    // where para pedidos del vendedor: EXISTS ClientesDux (cartera)
    const whereVendedorPedidos = idVendedor
      ? {
          [Op.and]: Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM ClientesDux c
              WHERE c.cliente = PedidoDux.cliente
                AND c.vendedorId = ${idVendedor}
            )
          `),
        }
      : undefined;

    // Total de clientes con al menos un pedido (en el universo elegido)
    const totalClientes = await PedidoDux.count({
      distinct: true,
      col: 'cliente',
      where: whereVendedorPedidos,
    });

    // Clientes que compraron este mes (según pedidos, no facturas)
    const clientesMes = await PedidoDux.count({
      distinct: true,
      col: 'cliente',
      where: {
        ...(whereVendedorPedidos || {}),
        fecha: { [Op.gte]: new Date(inicioMes + 'T00:00:00') },
      },
    });

    // Día con más pedidos (según pedidos)
    const topDia = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fecha')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: whereVendedorPedidos,
      group: [Sequelize.literal('DATE(fecha)')],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 1,
      raw: true,
    });

    const reporte =
      `Reporte Ejecutivo - Última Compra (${formatearFechaCorta(hoy)})\n\n` +
      `• Total de clientes con al menos una compra: ${totalClientes}\n` +
      `• Clientes que realizaron compras este mes: ${clientesMes}\n` +
      `• Día con más compras: ${topDia[0]?.fecha || '—'} (${topDia[0]?.cantidad || 0} pedidos)\n`;

    res.json({ reporte });
  } catch (error) {
    console.error('❌ Error en reporte ejecutivo última compra (PedidosDux):', error);
    res.status(500).json({ message: 'Error al generar reporte ejecutivo de última compra' });
  }
};

export const listarClientesDux = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      orden = 'fechaCreacion',
      direccion = 'DESC',
      buscar = '',
      provincia,
      localidad,
      vendedor,
    } = req.query;

    const idVendedor = await resolverIdVendedor(req);
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { cliente: { [Op.like]: `%${buscar}%` } },
        { cuitCuil: { [Op.like]: `%${buscar}%` } },
        { vendedor: { [Op.like]: `%${buscar}%` } },
        { correoElectronico: { [Op.like]: `%${buscar}%` } },
      ];
    }
    if (provincia) where.provincia = provincia;
    if (localidad) where.localidad = localidad;
    if (vendedor) where.vendedor = vendedor;
    if (idVendedor) where.vendedorId = idVendedor; // filtro por vendedor logueado

    const { count, rows } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, String(direccion).toUpperCase()]],
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('❌ Error al listar clientes Dux:', err);
    res.status(500).json({ message: 'Error al obtener clientes Dux' });
  }
};

const PEDIDO_FECHA_COL = 'fecha';
const PEDIDO_TOTAL_COL = 'total';

export const obtenerInformeClientesDux = async (req, res) => {
  try {
    const {
      fechaDesde,
      fechaHasta,
      listaPrecio,
      vendedor,
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (fechaDesde && fechaHasta) {
      where.fechaCreacion = {
        [Op.between]: [new Date(fechaDesde + 'T00:00:00'), new Date(fechaHasta + 'T23:59:59')],
      };
    }
    if (listaPrecio) where.listaPrecioPorDefecto = listaPrecio;
    if (vendedor) where.vendedor = vendedor;

    // 🔐 si hay vendedor logueado, restringimos la data a ese vendedor
    const idVendedorLog = await resolverIdVendedor(req);
    if (idVendedorLog) where.vendedorId = idVendedorLog;

    // 🎯 idVendedor a usar para "EXISTS (Facturas.id_vendedor)"
    let idVendedor = null;
    if (vendedor) {
      const encontrado = await PersonalDux.findOne({
        attributes: ['id_personal'],
        where: Sequelize.where(
          Sequelize.fn('CONCAT', Sequelize.col('apellido_razon_social'), ', ', Sequelize.col('nombre')),
          vendedor
        ),
        raw: true,
      });
      idVendedor = encontrado?.id_personal ?? null;
    } else if (idVendedorLog) {
      idVendedor = idVendedorLog;
    }

    // 📅 rango para PedidoDux
    const wherePedidosMes = {};
    if (fechaDesde && fechaHasta) {
      wherePedidosMes[PEDIDO_FECHA_COL] = {
        [Op.between]: [new Date(fechaDesde + 'T00:00:00'), new Date(fechaHasta + 'T23:59:59')],
      };
    }

    // =========================
    //   SERIES POR MES
    // =========================
    // 👉 Si HAY vendedor: NO calcular totales generales (porMesGeneral/montos/pedidos generales)
    // 👉 Si NO hay vendedor: calcular totales generales normalmente
    let porMesGeneral = [];
    let montosPorMesGeneral = [];
    let pedidosPorMesGeneral = [];

    if (!idVendedor) {
      porMesGeneral = await ClienteDux.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaCreacion'), '%Y-%m'), 'mes'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
        ],
        where,
        group: [Sequelize.literal("DATE_FORMAT(fechaCreacion, '%Y-%m')")],
        order: [[Sequelize.literal('mes'), 'ASC']],
        raw: true,
      });

      montosPorMesGeneral = await PedidoDux.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
          [Sequelize.fn('SUM', Sequelize.col(PEDIDO_TOTAL_COL)), 'monto'],
        ],
        where: wherePedidosMes,
        group: [Sequelize.literal(`DATE_FORMAT(${PEDIDO_FECHA_COL}, '%Y-%m')`)],
        order: [[Sequelize.literal('mes'), 'ASC']],
        raw: true,
      });

      pedidosPorMesGeneral = await PedidoDux.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
          [Sequelize.fn('COUNT', Sequelize.col('PedidoDux.id')), 'pedidosTotal'],
        ],
        where: wherePedidosMes,
        group: [Sequelize.literal(`DATE_FORMAT(${PEDIDO_FECHA_COL}, '%Y-%m')`)],
        order: [[Sequelize.literal('mes'), 'ASC']],
        raw: true,
      });
    }

    // 🔶 Vendedor (si aplica)
    const porMesVendedor = idVendedor
      ? await ClienteDux.findAll({
          attributes: [
            [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaCreacion'), '%Y-%m'), 'mes'],
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
          ],
          where, // ya restringe por vendedorId si hay logueado
          group: [Sequelize.literal("DATE_FORMAT(fechaCreacion, '%Y-%m')")],
          order: [[Sequelize.literal('mes'), 'ASC']],
          raw: true,
        })
      : [];

    const montosPorMesVendedor = idVendedor
      ? await PedidoDux.findAll({
          attributes: [
            [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
            [
              Sequelize.literal(
                `SUM(CASE WHEN EXISTS (
                   SELECT 1 FROM Facturas f
                   WHERE f.nro_pedido = PedidoDux.id
                     AND f.id_vendedor = ${idVendedor}
                 ) THEN PedidoDux.${PEDIDO_TOTAL_COL} ELSE 0 END)`
              ),
              'monto',
            ],
          ],
          where: wherePedidosMes,
          group: ['mes'],
          order: [['mes', 'ASC']],
          raw: true,
        })
      : [];

    const pedidosPorMesVendedor = idVendedor
      ? await PedidoDux.findAll({
          attributes: [
            [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
            [
              Sequelize.literal(
                `SUM(
                   CASE WHEN EXISTS (
                     SELECT 1 FROM Facturas f
                     WHERE f.nro_pedido = PedidoDux.id
                       AND f.id_vendedor = ${idVendedor}
                   ) THEN 1 ELSE 0 END
                 )`
              ),
              'pedidosVendedor',
            ],
          ],
          where: wherePedidosMes,
          group: ['mes'],
          order: [['mes', 'ASC']],
          raw: true,
        })
      : [];

    // =========================
    //   MERGE (sin totales si hay vendedor)
    // =========================
    const baseSeries = idVendedor ? porMesVendedor : porMesGeneral;

    const mapaGeneral = Object.fromEntries(
      baseSeries.map((d) => [
        d.mes,
        {
          mes: d.mes,
          total: idVendedor ? 0 : Number(d.cantidad || 0), // 🔕 cero si hay vendedor
          vendedor: idVendedor ? Number(d.cantidad || 0) : 0,
          montoTotal: 0,
          montoVendedor: 0,
          pedidosTotal: 0,
          pedidosVendedor: 0,
        },
      ])
    );

    // Completar campos generales SOLO si no hay vendedor
    if (!idVendedor) {
      for (const m of montosPorMesGeneral) {
        if (!mapaGeneral[m.mes]) mapaGeneral[m.mes] = { mes: m.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
        mapaGeneral[m.mes].montoTotal = Number(m.monto || 0);
      }
      for (const p of pedidosPorMesGeneral) {
        if (!mapaGeneral[p.mes]) mapaGeneral[p.mes] = { mes: p.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
        mapaGeneral[p.mes].pedidosTotal = Number(p.pedidosTotal || 0);
      }
    }

    // Completar campos del vendedor (si aplica)
    for (const m of montosPorMesVendedor) {
      if (!mapaGeneral[m.mes]) mapaGeneral[m.mes] = { mes: m.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[m.mes].montoVendedor = Number(m.monto || 0);
    }
    for (const p of pedidosPorMesVendedor) {
      if (!mapaGeneral[p.mes]) mapaGeneral[p.mes] = { mes: p.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[p.mes].pedidosVendedor = Number(p.pedidosVendedor || 0);
    }

    const porMesFinal = Object.values(mapaGeneral).sort((a, b) => a.mes.localeCompare(b.mes));

    // =========================
    //   POR DÍA
    // =========================
    let desde = fechaDesde;
    let hasta = fechaHasta;
    if (!fechaDesde || !fechaHasta) {
      desde = dayjs().startOf('year').format('YYYY-MM-DD');
      hasta = dayjs().format('YYYY-MM-DD');
    }

    // clientes/día ya respeta where (que puede tener vendedorId)
    const porDia = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fechaCreacion')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: {
        ...where,
        fechaCreacion: {
          [Op.between]: [new Date(desde + 'T00:00:00'), new Date(hasta + 'T23:59:59')],
        },
      },
      group: [Sequelize.literal('DATE(fechaCreacion)')],
      order: [[Sequelize.literal('fecha'), 'ASC']],
      raw: true,
    });

    // monto/día: si hay vendedor, solo sus pedidos; si no, totales
    const wherePedidosDia = {
      [PEDIDO_FECHA_COL]: {
        [Op.between]: [new Date(desde + 'T00:00:00'), new Date(hasta + 'T23:59:59')],
      },
    };

    const montoExpr = idVendedor
      ? `SUM(CASE WHEN EXISTS (
            SELECT 1 FROM Facturas f
            WHERE f.nro_pedido = PedidoDux.id
              AND f.id_vendedor = ${idVendedor}
          ) THEN PedidoDux.${PEDIDO_TOTAL_COL} ELSE 0 END)`
      : `SUM(PedidoDux.${PEDIDO_TOTAL_COL})`;

    const montosPorDia = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col(PEDIDO_FECHA_COL)), 'fecha'],
        [Sequelize.literal(montoExpr), 'monto'],
      ],
      where: wherePedidosDia,
      group: [Sequelize.literal(`DATE(${PEDIDO_FECHA_COL})`)],
      order: [[Sequelize.literal('fecha'), 'ASC']],
      raw: true,
    });

    const mapaDia = Object.fromEntries(
      porDia.map((d) => [d.fecha, { fecha: d.fecha, cantidad: Number(d.cantidad), monto: 0 }])
    );
    for (const m of montosPorDia) {
      if (!mapaDia[m.fecha]) mapaDia[m.fecha] = { fecha: m.fecha, cantidad: 0, monto: 0 };
      mapaDia[m.fecha].monto = Number(m.monto || 0);
    }
    const porDiaFinal = Object.values(mapaDia).sort((a, b) => a.fecha.localeCompare(b.fecha));

    // =========================
    //   DETALLE (ya filtrado por vendedor si aplica)
    // =========================
    const { rows: detalle, count } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['fechaCreacion', 'DESC']],
    });

    res.json({
      porMes: porMesFinal, // si hay vendedor, los campos "generales" vienen en 0
      porDia: porDiaFinal, // si hay vendedor, es del vendedor; si no, totales
      detalle,
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('❌ Error en informe de clientes Dux:', error);
    res.status(500).json({ message: 'Error al obtener informe de clientes Dux' });
  }
};

export const obtenerListasPrecioClientesDux = async (req, res) => {
  try {
    const resultados = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('listaPrecioPorDefecto')), 'lista'],
      ],
      where: {
        listaPrecioPorDefecto: { [Op.ne]: null },
      },
      order: [['lista', 'ASC']],
      raw: true,
    });

    const listas = resultados.map((r) => r.lista).filter(Boolean);
    res.json(listas);
  } catch (err) {
    console.error('❌ Error al obtener listas de precio:', err);
    res.status(500).json({ message: 'Error al obtener listas de precio' });
  }
};

export const reporteEjecutivoClientesDux = async (req, res) => {
  try {
    // 🔎 detectar vendedor (param o logueado)
    const { vendedor: vendedorParam } = req.query;
    let idVendedor = null;
    let vendedorLabel = null;

    if (vendedorParam) {
      const encontrado = await PersonalDux.findOne({
        attributes: ['id_personal', 'apellido_razon_social', 'nombre'],
        where: Sequelize.where(
          Sequelize.fn('CONCAT', Sequelize.col('apellido_razon_social'), ', ', Sequelize.col('nombre')),
          vendedorParam
        ),
        raw: true,
      });
      if (encontrado) {
        idVendedor = encontrado.id_personal;
        vendedorLabel = `${encontrado.apellido_razon_social}, ${encontrado.nombre}`;
      }
    } else {
      const idVendedorLog = await resolverIdVendedor(req);
      if (idVendedorLog) {
        idVendedor = idVendedorLog;
        const datos = await PersonalDux.findOne({
          attributes: ['apellido_razon_social', 'nombre'],
          where: { id_personal: idVendedorLog },
          raw: true,
        });
        if (datos) vendedorLabel = `${datos.apellido_razon_social}, ${datos.nombre}`;
      }
    }

    // 📅 fechas
    const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');
    const hoy = dayjs().format('YYYY-MM-DD');
    const inicioMesPasado = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const finMesPasado = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

    // 🔐 where base (si hay vendedor -> restringe TODO el informe a su cartera)
    const whereBase = idVendedor ? { vendedorId: idVendedor } : {};

    // =========================
    //        MÉTRICAS
    // =========================
    // Totales (si hay vendedor, son de su cartera; si no hay, son globales)
    const totalClientes = await ClienteDux.count({ where: { ...whereBase } });

    const clientesMesActual = await ClienteDux.count({
      where: {
        ...whereBase,
        fechaCreacion: { [Op.gte]: new Date(inicioMes + 'T00:00:00') },
      },
    });

    const clientesHoy = await ClienteDux.count({
      where: {
        ...whereBase,
        fechaCreacion: {
          [Op.between]: [new Date(hoy + 'T00:00:00'), new Date(hoy + 'T23:59:59')],
        },
      },
    });

    const clientesMesPasado = await ClienteDux.count({
      where: {
        ...whereBase,
        fechaCreacion: {
          [Op.between]: [new Date(inicioMesPasado + 'T00:00:00'), new Date(finMesPasado + 'T23:59:59')],
        },
      },
    });

    const crecimientoVsMesPasado = clientesMesPasado
      ? Math.round(((clientesMesActual - clientesMesPasado) / clientesMesPasado) * 100)
      : (clientesMesActual > 0 ? 100 : 0);

    // Rankers (si hay vendedor => NO ranking de vendedores; sí rank por provincia/loc/zona pero dentro de su cartera)
    const rankingVendedores = idVendedor
      ? [] // oculto ranking de vendedores si hay vendedor
      : await ClienteDux.findAll({
          attributes: ['vendedor', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']],
          where: { fechaCreacion: { [Op.gte]: new Date(inicioMes + 'T00:00:00') } },
          group: ['vendedor'],
          order: [[Sequelize.literal('cantidad'), 'DESC']],
          limit: 3,
          raw: true,
        });

    const rankingProvincias = await ClienteDux.findAll({
      attributes: ['provincia', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']],
      where: { ...whereBase },
      group: ['provincia'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    const rankingLocalidades = await ClienteDux.findAll({
      attributes: ['localidad', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']],
      where: { ...whereBase },
      group: ['localidad'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    const rankingZonas = await ClienteDux.findAll({
      attributes: ['zona', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']],
      where: { ...whereBase },
      group: ['zona'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    const semanasTranscurridas = Math.max(1, dayjs().diff(dayjs().startOf('month'), 'week') + 1);
    const promedioPorSemana = (clientesMesActual / semanasTranscurridas).toFixed(1);

    const diasMesActual = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fechaCreacion')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: {
        ...whereBase,
        fechaCreacion: { [Op.gte]: new Date(inicioMes + 'T00:00:00') },
      },
      group: [Sequelize.literal('DATE(fechaCreacion)')],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 1,
      raw: true,
    });
    const diaMayorAlta = diasMesActual[0];

    const totalHabilitados = await ClienteDux.count({ where: { ...whereBase, habilitado: true } });
    const porcentajeHabilitados = totalClientes ? Math.round((totalHabilitados / totalClientes) * 100) : 0;
    const porcentajeDeshabilitados = 100 - porcentajeHabilitados;

    // Provincias sin altas este mes (dentro del filtro)
    const provinciasAltasEsteMes = await ClienteDux.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('provincia')), 'provincia']],
      where: {
        ...whereBase,
        fechaCreacion: { [Op.gte]: new Date(inicioMes + 'T00:00:00') },
      },
      raw: true,
    });
    const provinciasTodas = await ClienteDux.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('provincia')), 'provincia']],
      where: { ...whereBase },
      raw: true,
    });
    const provinciasSinAltas = provinciasTodas
      .map((p) => p.provincia)
      .filter((p) => !provinciasAltasEsteMes.map((x) => x.provincia).includes(p));

    const distribucionListaPrecio = await ClienteDux.findAll({
      attributes: ['listaPrecioPorDefecto', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']],
      where: { ...whereBase },
      group: ['listaPrecioPorDefecto'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    });

    // =========================
    //    RENDER DEL REPORTE
    // =========================
    const titulo = idVendedor
      ? `Reporte Ejecutivo de Clientes Dux (Vendedor: ${vendedorLabel || idVendedor}) — ${dayjs().format('YYYY-MM-DD')}`
      : `Reporte Ejecutivo de Clientes Dux — ${dayjs().format('YYYY-MM-DD')}`;

    let reporte = `${titulo}\n\n`;

    // Sección 1: Totales (si hay vendedor, son de su cartera; no son "globales")
    reporte +=
      `1. Resumen${
        idVendedor ? " (tu cartera)" : ""
      }:\n` +
      `Total de clientes${idVendedor ? " de tu cartera" : ""}: ${totalClientes}\n` +
      `Altas en el mes actual: ${clientesMesActual}\n` +
      `Altas hoy: ${clientesHoy}\n\n`;

    // Sección 2: Crecimiento (dentro del filtro actual)
    reporte +=
      `2. Crecimiento vs mes pasado${
        idVendedor ? " (tu cartera)" : ""
      }:\n` +
      `Variación: ${crecimientoVsMesPasado >= 0 ? '+' : ''}${crecimientoVsMesPasado}%\n\n`;

    // Sección 3: Ranking de vendedores (solo si NO hay vendedor seleccionado)
    if (!idVendedor) {
      reporte +=
        `3. Ranking de vendedores (mes actual):\n` +
        (rankingVendedores.length
          ? rankingVendedores
              .map((v, i) => `${i + 1}. ${v.vendedor || 'Sin vendedor'} — ${v.cantidad} clientes`)
              .join('\n')
          : 'Sin datos') +
        '\n\n';
    }

    // Sección 4: Rankings geográficos (si hay vendedor: sobre su cartera)
    reporte +=
      `4. Provincias con más clientes${idVendedor ? " (tu cartera)" : ""}:\n` +
      (rankingProvincias.length
        ? rankingProvincias.map((p, i) => `${i === 0 ? '•' : ' '} ${p.provincia || 'Sin provincia'}: ${p.cantidad} clientes`).join('\n')
        : 'Sin datos') +
      '\n\n';

    reporte +=
      `5. Localidades con más clientes${idVendedor ? " (tu cartera)" : ""}:\n` +
      (rankingLocalidades.length
        ? rankingLocalidades.map((l, i) => `${i === 0 ? '•' : ' '} ${l.localidad || 'Sin localidad'}: ${l.cantidad} clientes`).join('\n')
        : 'Sin datos') +
      '\n\n';

    reporte +=
      `6. Zonas con más clientes${idVendedor ? " (tu cartera)" : ""}:\n` +
      (rankingZonas.length
        ? rankingZonas.map((z, i) => `${i === 0 ? '•' : ' '} ${z.zona || 'Sin zona'}: ${z.cantidad} clientes`).join('\n')
        : 'Sin datos') +
      '\n\n';

    // Sección 7: Métricas de actividad
    reporte +=
      `7. Métricas de actividad${
        idVendedor ? " (tu cartera)" : ""
      }:\n` +
      `Promedio semanal (mes actual): ${promedioPorSemana} clientes/semana\n` +
      `Día con más altas (mes actual): ${diaMayorAlta ? `${diaMayorAlta.fecha} (${diaMayorAlta.cantidad} clientes)` : 'Sin datos'}\n\n`;

    // Sección 8: Provincias sin nuevas altas
    reporte +=
      `8. Provincias sin nuevas altas${
        idVendedor ? " en tu cartera" : ""
      }:\n` +
      (provinciasSinAltas.length ? provinciasSinAltas.join(', ') : 'Todas registran altas en el período') +
      '\n\n';

    // Sección 9: Distribución por lista de precio
    reporte +=
      `9. Distribución por lista de precio${
        idVendedor ? " (tu cartera)" : ""
      }:\n` +
      (distribucionListaPrecio.length
        ? distribucionListaPrecio.map((lp) => `• ${lp.listaPrecioPorDefecto || 'Sin lista'}: ${lp.cantidad} clientes`).join('\n')
        : 'Sin datos') +
      '\n\n';

    res.json({ reporte });
  } catch (error) {
    console.error('❌ Error en reporte ejecutivo de clientes Dux:', error);
    res.status(500).json({ message: 'Error al generar reporte ejecutivo de clientes Dux' });
  }
};

export const obtenerInformeClientesUltimaCompra = async (req, res) => {
  try {
    const {
      fechaDesde,
      fechaHasta,
      listaPrecio,
      vendedor,             // "APELLIDO, NOMBRE" (opcional)
      page = 1,
      limit = 20,
      orden = 'fechaUltimaCompra',
      direccion = 'ASC',
    } = req.query;

    const offset = (page - 1) * limit;
    const dir = String(direccion).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // 🔐 Resolver idVendedor: prioridad parámetro > logueado
    let idVendedor = null;
    if (vendedor) {
      const encontrado = await PersonalDux.findOne({
        attributes: ['id_personal'],
        where: Sequelize.where(
          Sequelize.fn('CONCAT', Sequelize.col('apellido_razon_social'), ', ', Sequelize.col('nombre')),
          vendedor
        ),
        raw: true,
      });
      idVendedor = encontrado?.id_personal ?? null;
    }
    if (!idVendedor) {
      const idVendedorLog = await resolverIdVendedor(req);
      if (idVendedorLog) idVendedor = idVendedorLog;
    }

    // 🧠 Subconsulta: última fecha de pedido por cliente
    // Si hay vendedor -> solo pedidos de clientes cuya cartera (ClientesDux.vendedorId) sea ese vendedor
    const wherePedidos = {};
    // (no ponemos filtro de fechas acá para la "última" real; filtramos más abajo sobre el resultado enriquecido)

    const subquery = await PedidoDux.findAll({
      attributes: [
        'cliente',
        [Sequelize.fn('MAX', Sequelize.col('fecha')), 'fechaUltimaCompra'],
      ],
      where: idVendedor
        ? {
            ...wherePedidos,
            [Op.and]: Sequelize.literal(`
              EXISTS (
                SELECT 1
                FROM ClientesDux c
                WHERE c.cliente = PedidoDux.cliente
                  AND c.vendedorId = ${idVendedor}
              )
            `),
          }
        : wherePedidos,
      group: ['cliente'],
      raw: true,
    });

    if (!subquery.length) {
      return res.json({ detalle: [], totalPaginas: 0 });
    }

    const clienteFechaMap = Object.fromEntries(
      subquery.map(p => [p.cliente, p.fechaUltimaCompra])
    );

    // 🎯 WHERE para traer datos del cliente (ClienteDux)
    // Si hay vendedor => filtrar por vendedorId (cartera)
    const whereClientes = {
      cliente: { [Op.in]: Object.keys(clienteFechaMap) },
    };
    if (idVendedor) whereClientes.vendedorId = idVendedor;
    if (listaPrecio) whereClientes.listaPrecioPorDefecto = listaPrecio;
    // ⚠️ Ya no usamos where.vendedor = "APELLIDO, NOMBRE" porque ahora resolvemos id y usamos vendedorId

    const clientes = await ClienteDux.findAll({ where: whereClientes, raw: true });

    // 🧹 Enriquecer + filtrar por rango de fechas (si se pide)
    let clientesFiltrados = clientes
      .map(c => ({ ...c, fechaUltimaCompra: clienteFechaMap[c.cliente] }))
      .filter(c => {
        if (!c.fechaUltimaCompra) return false;
        if (fechaDesde && dayjs(c.fechaUltimaCompra).isBefore(dayjs(fechaDesde))) return false;
        if (fechaHasta && dayjs(c.fechaUltimaCompra).isAfter(dayjs(fechaHasta))) return false;
        return true;
      });

    // 🔽 Orden
    clientesFiltrados.sort((a, b) => {
      const valA = a[orden];
      const valB = b[orden];
      if (orden === 'fechaUltimaCompra') {
        const aT = valA ? new Date(valA).getTime() : 0;
        const bT = valB ? new Date(valB).getTime() : 0;
        return dir === 'ASC' ? aT - bT : bT - aT;
      }
      // fallback string
      const cmp = String(valA ?? '').localeCompare(String(valB ?? ''));
      return dir === 'ASC' ? cmp : -cmp;
    });

    // 📄 Paginación
    const total = clientesFiltrados.length;
    const totalPaginas = Math.ceil(total / Number(limit) || 1);
    const detalle = clientesFiltrados.slice(offset, offset + Number(limit));

    res.json({ detalle, totalPaginas });
  } catch (error) {
    console.error('❌ Error en informe de última compra (PedidosDux join ClientesDux):', error);
    res.status(500).json({ message: 'Error al obtener informe de última compra' });
  }
};

export const obtenerClientesDuxGeo = async (req, res) => {
  try {
    const idVendedor = await resolverIdVendedor(req);

    const filas = await sequelize.query(
      `
      WITH agg_fact AS (
        SELECT 
          f.id_cliente,
          COALESCE(SUM(f.total), 0) AS volumenTotal,
          MAX(f.fecha_comp)         AS fechaUltimaCompra,
          COUNT(DISTINCT f.nro_pedido) AS totalPedidos
        FROM Facturas f
        GROUP BY f.id_cliente
      ),
      ult_fact AS (
        SELECT x.id_cliente, f2.total AS montoUltimaCompra
        FROM (
          SELECT f.id_cliente, MAX(f.fecha_comp) AS max_fecha
          FROM Facturas f
          GROUP BY f.id_cliente
        ) x
        JOIN Facturas f2 
          ON f2.id_cliente = x.id_cliente
         AND f2.fecha_comp = x.max_fecha
      )
      SELECT
        c.id, c.cliente, c.nombreFantasia, c.domicilio, c.localidad, c.provincia,
        c.latitud AS lat, c.longitud AS lng, c.geoPrecision, c.geoFuente, c.geoActualizadoAt,
        c.vendedorId, CONCAT(pd.apellido_razon_social, ', ', pd.nombre) AS vendedorNombre,
        COALESCE(af.volumenTotal, 0) AS volumenTotal,
        COALESCE(af.totalPedidos, 0) AS totalPedidos,
        af.fechaUltimaCompra AS fechaUltimaCompra,
        uf.montoUltimaCompra AS montoUltimaCompra
      FROM ClientesDux c
      LEFT JOIN agg_fact af ON af.id_cliente = c.id
      LEFT JOIN ult_fact uf ON uf.id_cliente = c.id
      LEFT JOIN PersonalDux pd ON pd.id_personal = c.vendedorId
      ${idVendedor ? `WHERE c.vendedorId = ${idVendedor}` : ''}
      ORDER BY c.id
      `,
      { type: QueryTypes.SELECT }
    );

    res.json(filas);
  } catch (err) {
    console.error('❌ Error en obtenerClientesDuxGeo:', err);
    res.status(500).json({ error: 'Error al obtener datos geográficos de clientes Dux' });
  }
};

export const geocodificarBatchClientesDux = async (req, res) => {
  try {
    const idVendedor = await resolverIdVendedor(req);
    const body = req.body || {};
    const limit = Number(body.limit ?? 500);
    const onlyMissing = body.onlyMissing !== false;
    const { provincia, localidad } = body;

    const where = {};
    if (provincia) where.provincia = provincia;
    if (localidad) where.localidad = localidad;
    if (onlyMissing) where.latitud = { [Op.is]: null };
    if (idVendedor) where.vendedorId = idVendedor;

    const clientes = await ClienteDux.findAll({ where, limit });

    const limitConcurrente = pLimit(2);
    const tareas = clientes.map((c) =>
      limitConcurrente(async () => {
        if (c.geoActualizadoAt == null) {
          const r = await geocodificarClienteDuxFila(c);
          await c.update({
            latitud: r.lat,
            longitud: r.lon,
            geoPrecision: r.precision,
            geoFuente: r.fuente,
            geoActualizadoAt: new Date(),
          });
          return { id: c.id, precision: r.precision };
        }
      })
    );

    const resultados = await Promise.all(tareas);
    res.json({ procesados: resultados.length, detalles: resultados });
  } catch (error) {
    console.error('❌ Error en geocodificarBatchClientesDux:', error);
    res.status(500).json({ message: 'Error al geocodificar clientes Dux' });
  }
};