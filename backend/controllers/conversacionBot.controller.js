import { ConversacionBot } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';

export const listarConversacionesBot = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      buscar = '',
      derivar = '',
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { telefono: { [Op.like]: `%${buscar}%` } },
        { mensajeCliente: { [Op.like]: `%${buscar}%` } },
        { respuestaBot: { [Op.like]: `%${buscar}%` } },
      ];
    }

    if (derivar !== '') {
      where.derivar = derivar === 'true';
    }

    const { count, rows } = await ConversacionBot.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      data: rows,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
      totalItems: count,
      hasNextPage: Number(page) < Math.ceil(count / limit),
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    console.error('❌ Error al listar conversaciones:', error);
    next(error);
  }
};

export const listarUltimasConversacionesPorCliente = async (req, res, next) => {
  try {
    const resultados = await ConversacionBot.findAll({
      attributes: [
        'telefono',
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'ultimoMensaje'],
      ],
      group: ['telefono'],
      order: [[Sequelize.fn('MAX', Sequelize.col('createdAt')), 'DESC']],
    });

    res.json(resultados);
  } catch (error) {
    console.error('❌ Error al listar últimos mensajes por cliente:', error);
    next(error);
  }
};

export const listarConversacionesAgrupadas = async (req, res, next) => {
  try {
    const { buscar = '' } = req.query;

    const where = {};
    if (buscar) {
      where.telefono = { [Op.like]: `%${buscar}%` };
    }

    const conversaciones = await ConversacionBot.findAll({
      where,
      order: [['telefono', 'ASC'], ['createdAt', 'ASC']],
    });

    const agrupadas = {};

    for (const conv of conversaciones) {
      const tel = conv.telefono;
      if (!agrupadas[tel]) agrupadas[tel] = [];

      agrupadas[tel].push({
        mensajeCliente: conv.mensajeCliente,
        respuestaBot: conv.respuestaBot,
        derivar: conv.derivar,
        createdAt: conv.createdAt,
      });
    }

    const resultado = Object.entries(agrupadas).map(([telefono, historial]) => ({
      telefono,
      historial,
    }));

    res.json({ data: resultado });
  } catch (error) {
    console.error('❌ Error al agrupar conversaciones:', error);
    next(error);
  }
};

export const responderManual = async (req, res, next) => {
  try {
    const { telefono, mensaje } = req.body;

    if (!telefono || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const conversacion = await ConversacionBot.create({
      telefono,
      mensajeCliente: '',
      respuestaBot: mensaje,
      derivar: false,
      manual: true,
    });

    // Enviar mensaje por WhatsApp
    await enviarMensajeTextoLibreWhatsapp(telefono, mensaje);

    res.json({ ok: true, conversacion });
  } catch (err) {
    console.error('❌ Error al guardar respuesta manual:', err);
    next(err);
  }
};

