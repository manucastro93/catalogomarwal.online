import { ClienteDux, PedidoDux, PersonalDux, sequelize } from '../models/index.js';
import { Op, Sequelize, QueryTypes } from 'sequelize';
import dayjs from "dayjs";
import { formatearFechaCorta } from '../utils/fecha.js'
import { geocodificarClienteDuxFila } from '../helpers/normalizarDireccion.js'
import fetch from 'node-fetch';
import pLimit from 'p-limit'; 

export const reporteEjecutivoUltimaCompra = async (req, res) => {
  try {
    const hoy = dayjs().format('YYYY-MM-DD');
    const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');

    // Total de clientes con al menos un pedido
    const totalClientes = await PedidoDux.aggregate('cliente', 'count', { distinct: true });

    // Clientes que compraron este mes
    const clientesMes = await PedidoDux.aggregate('cliente', 'count', {
      distinct: true,
      where: {
        fecha: { [Op.gte]: new Date(inicioMes + 'T00:00:00') },
      },
    });

    // Día con más pedidos
    const topDia = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fecha')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
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
    console.error('❌ Error en reporte ejecutivo última compra:', error);
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

    const offset = (page - 1) * limit;
    const where = {};

    // 🔍 Filtro por texto libre
    if (buscar) {
      where[Op.or] = [
        { cliente: { [Op.like]: `%${buscar}%` } },
        { cuitCuil: { [Op.like]: `%${buscar}%` } },
        { vendedor: { [Op.like]: `%${buscar}%` } },
        { correoElectronico: { [Op.like]: `%${buscar}%` } },
      ];
    }

    // 🔍 Filtros específicos opcionales
    if (provincia) where.provincia = provincia;
    if (localidad) where.localidad = localidad;
    if (vendedor) where.vendedor = vendedor;

    const { count, rows } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion.toUpperCase()]],
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
      vendedor, // "APELLIDO, NOMBRE" (para mapear a PersonalDux.id_personal)
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

    // Mapear vendedor ("APELLIDO, NOMBRE") -> id_personal (para usar en Facturas.id_vendedor)
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

    // 🔷 Clientes por mes (general)
    const porMesGeneral = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaCreacion'), '%Y-%m'), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: [Sequelize.literal("DATE_FORMAT(fechaCreacion, '%Y-%m')")],
      order: [[Sequelize.literal('mes'), 'ASC']],
      raw: true,
    });

    // 🔶 Clientes por mes (vendedor)
    let porMesVendedor = [];
    if (vendedor) {
      porMesVendedor = await ClienteDux.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaCreacion'), '%Y-%m'), 'mes'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
        ],
        where: { vendedor },
        group: [Sequelize.literal("DATE_FORMAT(fechaCreacion, '%Y-%m')")],
        order: [[Sequelize.literal('mes'), 'ASC']],
        raw: true,
      });
    }

    // Rango para consultas sobre PedidosDux
    const wherePedidosMes = {};
    if (fechaDesde && fechaHasta) {
      wherePedidosMes[PEDIDO_FECHA_COL] = {
        [Op.between]: [new Date(fechaDesde + 'T00:00:00'), new Date(fechaHasta + 'T23:59:59')],
      };
    }

    // 💵 Monto de pedidos por mes (general)
    const montosPorMesGeneral = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
        [Sequelize.fn('SUM', Sequelize.col(PEDIDO_TOTAL_COL)), 'monto'],
      ],
      where: wherePedidosMes,
      group: [Sequelize.literal(`DATE_FORMAT(${PEDIDO_FECHA_COL}, '%Y-%m')`)],
      order: [[Sequelize.literal('mes'), 'ASC']],
      raw: true,
    });

    // 💵 Monto de pedidos por mes (vendedor) usando EXISTS con Facturas.id_vendedor
    let montosPorMesVendedor = [];
    if (idVendedor) {
      montosPorMesVendedor = await PedidoDux.findAll({
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
      });
    }

    // 🧮 Cantidad de pedidos por mes (general)
    const pedidosPorMesGeneral = await PedidoDux.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('PedidoDux.id')), 'pedidosTotal'],
      ],
      where: wherePedidosMes,
      group: [Sequelize.literal(`DATE_FORMAT(${PEDIDO_FECHA_COL}, '%Y-%m')`)],
      order: [[Sequelize.literal('mes'), 'ASC']],
      raw: true,
    });

    // 🧮 Cantidad de pedidos por mes (vendedor) — EXISTS con Facturas.id_vendedor
    let pedidosPorMesVendedor = [];
    if (idVendedor) {
      pedidosPorMesVendedor = await PedidoDux.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col(PEDIDO_FECHA_COL), '%Y-%m'), 'mes'],
          [
            Sequelize.literal(
              `SUM(
                 EXISTS (
                   SELECT 1 FROM Facturas f
                   WHERE f.nro_pedido = PedidoDux.id
                     AND f.id_vendedor = ${idVendedor}
                 )
               )`
            ),
            'pedidosVendedor',
          ],
        ],
        where: wherePedidosMes,
        group: ['mes'],
        order: [['mes', 'ASC']],
        raw: true,
      });
    }

    // 🧠 Merge porMes
    const mapaGeneral = Object.fromEntries(
      porMesGeneral.map((d) => [
        d.mes,
        {
          mes: d.mes,
          total: Number(d.cantidad),
          vendedor: 0,
          montoTotal: 0,
          montoVendedor: 0,
          pedidosTotal: 0,
          pedidosVendedor: 0,
        },
      ])
    );

    for (const d of porMesVendedor) {
      if (!mapaGeneral[d.mes]) mapaGeneral[d.mes] = { mes: d.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[d.mes].vendedor = Number(d.cantidad || 0);
    }
    for (const m of montosPorMesGeneral) {
      if (!mapaGeneral[m.mes]) mapaGeneral[m.mes] = { mes: m.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[m.mes].montoTotal = Number(m.monto || 0);
    }
    for (const m of montosPorMesVendedor) {
      if (!mapaGeneral[m.mes]) mapaGeneral[m.mes] = { mes: m.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[m.mes].montoVendedor = Number(m.monto || 0);
    }
    for (const p of pedidosPorMesGeneral) {
      if (!mapaGeneral[p.mes]) mapaGeneral[p.mes] = { mes: p.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[p.mes].pedidosTotal = Number(p.pedidosTotal || 0);
    }
    for (const p of pedidosPorMesVendedor) {
      if (!mapaGeneral[p.mes]) mapaGeneral[p.mes] = { mes: p.mes, total: 0, vendedor: 0, montoTotal: 0, montoVendedor: 0, pedidosTotal: 0, pedidosVendedor: 0 };
      mapaGeneral[p.mes].pedidosVendedor = Number(p.pedidosVendedor || 0);
    }

    const porMesFinal = Object.values(mapaGeneral).sort((a, b) => a.mes.localeCompare(b.mes));

    // 📈 Por día (clientes + monto)
    let desde = fechaDesde;
    let hasta = fechaHasta;
    if (!fechaDesde || !fechaHasta) {
      desde = dayjs().startOf('year').format('YYYY-MM-DD');
      hasta = dayjs().format('YYYY-MM-DD');
    }

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

    // Monto por día (si hay vendedor, sumar solo pedidos con factura del id_vendedor)
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

    // 📋 Tabla de detalle
    const { rows: detalle, count } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['fechaCreacion', 'DESC']],
    });

    res.json({
      porMes: porMesFinal, // { mes, total, vendedor, montoTotal, montoVendedor, pedidosTotal, pedidosVendedor }
      porDia: porDiaFinal, // { fecha, cantidad, monto }
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
    // Total de clientes
    const totalClientes = await ClienteDux.count();

    // Clientes creados este mes y hoy
    const inicioMes = dayjs().startOf('month').format('YYYY-MM-DD');
    const hoy = dayjs().format('YYYY-MM-DD');

    const clientesMesActual = await ClienteDux.count({
      where: {
        fechaCreacion: {
          [Op.gte]: new Date(inicioMes + 'T00:00:00'),
        },
      },
    });

    const clientesHoy = await ClienteDux.count({
      where: {
        fechaCreacion: {
          [Op.between]: [
            new Date(hoy + 'T00:00:00'),
            new Date(hoy + 'T23:59:59')
          ],
        },
      },
    });

    // Crecimiento vs mes pasado
    const inicioMesPasado = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const finMesPasado = dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    const clientesMesPasado = await ClienteDux.count({
      where: {
        fechaCreacion: {
          [Op.between]: [
            new Date(inicioMesPasado + 'T00:00:00'),
            new Date(finMesPasado + 'T23:59:59')
          ],
        },
      },
    });

    const crecimientoVsMesPasado = clientesMesPasado
      ? Math.round(((clientesMesActual - clientesMesPasado) / clientesMesPasado) * 100)
      : 100;

    // Ranking vendedores (top 3, solo mes actual)
    const rankingVendedores = await ClienteDux.findAll({
      attributes: [
        'vendedor',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: {
        fechaCreacion: {
          [Op.gte]: new Date(inicioMes + 'T00:00:00'),
        },
      },
      group: ['vendedor'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    // Ranking provincias
    const rankingProvincias = await ClienteDux.findAll({
      attributes: [
        'provincia',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: ['provincia'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    // Ranking localidades
    const rankingLocalidades = await ClienteDux.findAll({
      attributes: [
        'localidad',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: ['localidad'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    // Ranking zonas
    const rankingZonas = await ClienteDux.findAll({
      attributes: [
        'zona',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: ['zona'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 3,
      raw: true,
    });

    // Promedio por semana (mes actual)
    const semanasTranscurridas = Math.max(1, dayjs().diff(dayjs().startOf('month'), 'week') + 1);
    const promedioPorSemana = (clientesMesActual / semanasTranscurridas).toFixed(1);

    // Día con mayor altas (mes actual)
    const diasMesActual = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fechaCreacion')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: {
        fechaCreacion: {
          [Op.gte]: new Date(inicioMes + 'T00:00:00'),
        },
      },
      group: [Sequelize.literal('DATE(fechaCreacion)')],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      limit: 1,
      raw: true,
    });
    const diaMayorAlta = diasMesActual[0];

    // Habilitados/deshabilitados
    const totalHabilitados = await ClienteDux.count({ where: { habilitado: true } });
    const porcentajeHabilitados = totalClientes ? Math.round((totalHabilitados / totalClientes) * 100) : 0;
    const porcentajeDeshabilitados = 100 - porcentajeHabilitados;

    // Provincias sin altas este mes
    const provinciasAltasEsteMes = await ClienteDux.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('provincia')), 'provincia']],
      where: {
        fechaCreacion: {
          [Op.gte]: new Date(inicioMes + 'T00:00:00'),
        },
      },
      raw: true,
    });
    const provinciasTodas = await ClienteDux.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('provincia')), 'provincia']],
      raw: true,
    });
    const provinciasSinAltas = provinciasTodas
      .map((p) => p.provincia)
      .filter((p) => !provinciasAltasEsteMes.map((x) => x.provincia).includes(p));

    // Distribución por lista de precio
    const distribucionListaPrecio = await ClienteDux.findAll({
      attributes: [
        'listaPrecioPorDefecto',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: ['listaPrecioPorDefecto'],
      order: [[Sequelize.literal('cantidad'), 'DESC']],
      raw: true,
    });

    // --- Generar el string del reporte ejecutivo ---
    const reporte =
      `Reporte Ejecutivo de Clientes Dux — ${dayjs().format('YYYY-MM-DD')}\n\n` +
      `1. Total de clientes registrados:\nActualmente existen ${totalClientes} clientes activos en la base de datos.\n\n` +
      `2. Altas recientes:\nEn el mes actual se han creado ${clientesMesActual} nuevos clientes.\nEn el día de hoy se registraron ${clientesHoy} nuevos clientes.\n\n` +
      `3. Crecimiento mensual:\nLa cantidad de clientes creció un ${crecimientoVsMesPasado >= 0 ? '+' : ''}${crecimientoVsMesPasado}% respecto al mes anterior.\n\n` +
      `4. Ranking de vendedores por clientes creados en el mes:\n` +
      rankingVendedores.map((v, i) => `${i + 1}. ${v.vendedor || 'Sin vendedor'} — ${v.cantidad} clientes`).join('\n') + '\n\n' +
      `5. Provincia con mayor cantidad de clientes:\n` +
      rankingProvincias.map((p, i) => `${i === 0 ? '•' : ' '} ${p.provincia || 'Sin provincia'}: ${p.cantidad} clientes`).join('\n') + '\n\n' +
      `6. Localidad con mayor cantidad de clientes:\n` +
      rankingLocalidades.map((l, i) => `${i === 0 ? '•' : ' '} ${l.localidad || 'Sin localidad'}: ${l.cantidad} clientes`).join('\n') + '\n\n' +
      `7. Zona con mayor cantidad de clientes:\n` +
      rankingZonas.map((z, i) => `${i === 0 ? '•' : ' '} ${z.zona || 'Sin zona'}: ${z.cantidad} clientes`).join('\n') + '\n\n' +
      `8. Métricas de actividad:\nPromedio de ${promedioPorSemana} clientes creados por semana en el mes actual.\nDía con mayor altas: ${diaMayorAlta ? `${diaMayorAlta.fecha} (${diaMayorAlta.cantidad} clientes creados)` : 'Sin datos'}.\n\n` +
      `9. Provincias sin nuevas altas:\n${provinciasSinAltas.length ? provinciasSinAltas.join(', ') : 'Todas tienen altas este mes'}\n\n` +
      `10. Distribución por lista de precio:\n` +
      distribucionListaPrecio.map((lp) => `• ${lp.listaPrecioPorDefecto || 'Sin lista'}: ${lp.cantidad} clientes`).join('\n') + '\n\n';

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
      vendedor,
      page = 1,
      limit = 20,
      orden = 'fechaUltimaCompra',
      direccion = 'ASC',
    } = req.query;

    const offset = (page - 1) * limit;

    // Subconsulta: fecha última compra por cliente
    const subquery = await PedidoDux.findAll({
      attributes: [
        'cliente',
        [Sequelize.fn('MAX', Sequelize.col('fecha')), 'fechaUltimaCompra'],
      ],
      group: ['cliente'],
      raw: true,
    });

    const clienteFechaMap = Object.fromEntries(
      subquery.map((p) => [p.cliente, p.fechaUltimaCompra])
    );

    const where = {
      cliente: { [Op.in]: Object.keys(clienteFechaMap) },
    };
    if (listaPrecio) where.listaPrecioPorDefecto = listaPrecio;
    if (vendedor) where.vendedor = vendedor;

    const clientes = await ClienteDux.findAll({
      where,
      raw: true,
    });

    // Enriquecer y filtrar por fechaUltimaCompra
    let clientesFiltrados = clientes.map((c) => ({
      ...c,
      fechaUltimaCompra: clienteFechaMap[c.cliente],
    })).filter((c) => {
      if (!c.fechaUltimaCompra) return false;
      if (fechaDesde && dayjs(c.fechaUltimaCompra).isBefore(dayjs(fechaDesde))) return false;
      if (fechaHasta && dayjs(c.fechaUltimaCompra).isAfter(dayjs(fechaHasta))) return false;
      return true;
    });

    // 🔽 Ordenar por cualquier campo
    clientesFiltrados.sort((a, b) => {
      const dir = direccion.toUpperCase() === 'ASC' ? 1 : -1;
      const valA = a[orden];
      const valB = b[orden];

      if (!valA && !valB) return 0;
      if (!valA) return -1 * dir;
      if (!valB) return 1 * dir;

      if (orden === 'fechaUltimaCompra') {
        return (new Date(valA).getTime() - new Date(valB).getTime()) * dir;
      }

      return valA.toString().localeCompare(valB.toString()) * dir;
    });

    const total = clientesFiltrados.length;
    const totalPaginas = Math.ceil(total / limit);
    const detalle = clientesFiltrados.slice(offset, offset + Number(limit));

    res.json({ detalle, totalPaginas });
  } catch (error) {
    console.error('❌ Error en informe de última compra:', error);
    res.status(500).json({ message: 'Error al obtener informe de última compra' });
  }
};

export const obtenerClientesDuxGeo = async (req, res) => {
  try {
    const filas = await sequelize.query(
      `
      /* Agregados por id_cliente desde Facturas */
      WITH agg_fact AS (
        SELECT 
          f.id_cliente,
          COALESCE(SUM(f.total), 0)                            AS volumenTotal,
          MAX(f.fecha_comp)                                    AS fechaUltimaCompra,
          COUNT(DISTINCT f.nro_pedido)                         AS totalPedidos
        FROM Facturas f
        GROUP BY f.id_cliente
      ),
      /* Último monto por id_cliente: tomamos la factura con fecha_comp máxima */
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
        c.id,
        c.cliente,
        c.nombreFantasia,
        c.domicilio,
        c.localidad,
        c.provincia,
        c.latitud  AS lat,
        c.longitud AS lng,
        c.geoPrecision,
        c.geoFuente,
        c.geoActualizadoAt,
        c.vendedorId,
        CONCAT(pd.apellido_razon_social, ', ', pd.nombre) AS vendedorNombre,

        COALESCE(af.volumenTotal, 0)   AS volumenTotal,
        COALESCE(af.totalPedidos, 0)   AS totalPedidos,
        af.fechaUltimaCompra           AS fechaUltimaCompra,
        uf.montoUltimaCompra           AS montoUltimaCompra

      FROM ClientesDux c
      LEFT JOIN agg_fact af ON af.id_cliente = c.id          -- 🔑 clave robusta
      LEFT JOIN ult_fact uf ON uf.id_cliente = c.id
      LEFT JOIN PersonalDux pd ON pd.id_personal = c.vendedorId
      /* sin WHERE para no filtrar clientes */
      ORDER BY c.id
      `,
      { type: QueryTypes.SELECT }
    );

    res.json(filas);
  } catch (err) {
    console.error("❌ Error en obtenerClientesDuxGeo:", err);
    res.status(500).json({ error: "Error al obtener datos geográficos de clientes Dux" });
  }
};

export const geocodificarBatchClientesDux = async (req, res) => {
  try {
    const { limit = 500, onlyMissing = true, provincia, localidad } = req.body || {};
    const where = {};
    if (provincia) where.provincia = provincia;
    if (localidad) where.localidad = localidad;
    if (onlyMissing) where.latitud = { [Op.is]: null };

    const clientes = await ClienteDux.findAll({ where, limit: Number(limit) });

    const limitConcurrente = pLimit(2); // evitar rate-limit de Nominatim
    const tareas = clientes.map((c) => limitConcurrente(async () => {
      if(c.geoActualizadoAt == null){
        console.log("geolocalizando a: ", c.cliente)
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
    }));

    const resultados = await Promise.all(tareas);
    res.json({ procesados: resultados.length, detalles: resultados });
  } catch (error) {
    console.error('❌ Error en geocodificarBatchClientesDux:', error);
    res.status(500).json({ message: 'Error al geocodificar clientes Dux' });
  }
};
