import { LogCliente, IpCliente, Cliente, Categoria } from '@/models';
import { Op } from 'sequelize';
import { getClientIp } from '@/utils/getClientIp';
import dayjs from 'dayjs';

export const registrarLogCliente = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const {
      categoriaId = null,
      busqueda = null,
      tiempoEnPantalla = null,
      ubicacion = null,
      sesion = null,
      referer = null,
      fuente = null,
    } = req.body;

    const ipCliente = await IpCliente.findOne({ where: { ip } });
    const ipClienteId = ipCliente?.id || null;

    if (!ipClienteId && !busqueda && !categoriaId) {
      return res.status(400)on({ message: 'Faltan datos o IP no registrada' });
    }

    const log = await LogCliente.create({
      ipClienteId,
      categoriaId,
      busqueda,
      tiempoEnPantalla,
      ubicacion,
      sesion,
      referer,
      fuente,
    });

    res.status(201)on({ message: 'Log registrado', log });
  } catch (error) {
    console.error('❌ Error al registrar log del cliente:', error);
    next(error);
  }
};

export const listarLogsCliente = async (req, res, next) => {
  try {
    const {
      clienteId,
      ip,
      desde,
      hasta,
      limit = 100,
      page = 1,
      groupBy,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    const include = [
      {
        model: IpCliente,
        as: 'ipCliente',
        required: false,
        attributes: ['ip'],
        include: [
          {
            model: Cliente,
            as: 'clientes',
            attributes: ['id', 'nombre'],
            through: { attributes: [] }, // no mostrar datos de la tabla pivot
            required: false,
          }
        ],
      },
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre'],
        required: false,
      },
    ];

    // ✅ Filtro por fecha
    if (desde && hasta) {
      where.createdAt = {
        [Op.between]: [new Date(desde), new Date(hasta)],
      };
    }

    // ✅ NO filtramos por IP ni clienteId aquí. Vamos a filtrar luego.
    const paginando = groupBy !== 'ipFecha';

    const { count, rows } = await LogCliente.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      ...(paginando && { limit: Number(limit), offset }),
    });
    // ✅ Filtro manual por clienteId si viene
    const filtrados = clienteId
      ? rows.filter((log) => {
          const ipCliente = log.ipCliente;
          const cliente = ipCliente?.cliente;
          return (
            cliente?.id == clienteId || ipCliente?.clienteId == clienteId
          );
        })
      : rows;

    // ✅ Agrupado por IP y fecha
    if (groupBy === 'ipFecha') {
      const grouped = filtrados.reduce((acc, log) => {
        const fecha = dayjs(log.createdAt).format('YYYY-MM-DD');
        const ip = log.ipCliente?.ip || 'Sin IP';
        const key = `${ip} - ${fecha}`;
        acc[key] = acc[key] || [];
        acc[key].push(log);
        return acc;
      }, {});
      return reson({ grouped });
    }

    return reson({
      data: filtrados,
      total: filtrados.length,
      pagina: Number(page),
      totalPaginas: Math.ceil(filtrados.length / limit),
    });
  } catch (error) {
    console.error('❌ Error al listar logs:', error);
    next(error);
  }
};

