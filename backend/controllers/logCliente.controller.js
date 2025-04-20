import { LogCliente, IpCliente, Cliente } from '../models/index.js';
import { Op } from 'sequelize';
import { getClientIp } from '../utils/getClientIp.js';

export const registrarLogCliente = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const {
      categoriaId = null,
      busqueda = null,
      tiempoEnPantalla = null,
      ubicacion = null,
      sesion = null,
      referer = null
    } = req.body;

    const ipCliente = await IpCliente.findOne({ where: { ip } });
    const ipClienteId = ipCliente?.id || null;

    if (!ipClienteId && !busqueda && !categoriaId) {
      return res.status(400).json({ message: 'Faltan datos o IP no registrada' });
    }

    const log = await LogCliente.create({
      ipClienteId,
      categoriaId,
      busqueda,
      tiempoEnPantalla,
      ubicacion,
      sesion,
      referer,
    });

    res.status(201).json({ message: 'Log registrado', log });
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
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};
    const include = [
      {
        model: IpCliente,
        as: 'ipCliente',
        include: [{ model: Cliente, as: 'cliente' }],
      },
    ];

    if (desde && hasta) {
      where.createdAt = {
        [Op.between]: [new Date(desde), new Date(hasta)],
      };
    }

    if (ip) {
      include[0].where = { ...(include[0].where || {}), ip };
    }

    if (clienteId) {
      include[0].where = { ...(include[0].where || {}), clienteId };
    }

    const { count, rows } = await LogCliente.findAndCountAll({
      where,
      include,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('❌ Error al listar logs:', error);
    next(error);
  }
};