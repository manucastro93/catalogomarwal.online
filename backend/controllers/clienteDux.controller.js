import { ClienteDux } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import dayjs from "dayjs";

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

    // Filtros comunes para tabla y porDia
    if (fechaDesde && fechaHasta) {
      where.fechaCreacion = {
        [Op.between]: [new Date(fechaDesde + 'T00:00:00'), new Date(fechaHasta + 'T23:59:59')],
      };
    } else {
      // Si no recibe rango, usar de principio de mes hasta hoy SOLO para porDia
      // (no afecta la tabla ni porMes)
    }

    if (listaPrecio) where.listaPrecioPorDefecto = listaPrecio;
    if (vendedor) where.vendedor = vendedor;

    // 📊 Clientes por mes (NO se afectan por filtros)
    const porMes = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('fechaCreacion'), '%Y-%m'), 'mes'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      group: [Sequelize.literal("DATE_FORMAT(fechaCreacion, '%Y-%m')")],
      order: [[Sequelize.literal("mes"), 'ASC']],
      raw: true,
    });

    // 📈 Clientes por día
    let porDia = [];
    let desde = fechaDesde;
    let hasta = fechaHasta;
    if (!fechaDesde || !fechaHasta) {
      desde = dayjs().startOf("month").format("YYYY-MM-DD");
      hasta = dayjs().format("YYYY-MM-DD");
    }

    porDia = await ClienteDux.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('fechaCreacion')), 'fecha'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad'],
      ],
      where: {
        ...where,
        // Para porDia, usar el rango calculado
        fechaCreacion: {
          [Op.between]: [new Date(desde + 'T00:00:00'), new Date(hasta + 'T23:59:59')],
        },
      },
      group: [Sequelize.literal("DATE(fechaCreacion)")],
      order: [[Sequelize.literal("fecha"), 'ASC']],
      raw: true,
    });

    // 📋 Tabla de detalle paginada (con los filtros comunes)
    const { rows: detalle, count } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['fechaCreacion', 'DESC']],
    });

    res.json({
      porMes,
      porDia,
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