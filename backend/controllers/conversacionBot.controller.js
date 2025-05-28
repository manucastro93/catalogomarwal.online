import { ConversacionBot, Cliente } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';

function normalizarTelefono(numero) {
  if (!numero) return '';
  return numero
    .replace(/\D/g, '')
    .replace(/^54911/, '011')
    .replace(/^5411/, '011')
    .replace(/^11/, '011')
    .replace(/^0+/, '');
}

// GET /conversaciones
export const listarConversacionesBot = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '', derivar = '' } = req.query;
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

// GET /conversaciones/ultimas
export const listarUltimasConversacionesPorCliente = async (req, res, next) => {
  try {
    const conversaciones = await ConversacionBot.findAll({
      attributes: [
        'telefono',
        [Sequelize.fn('MAX', Sequelize.col('createdAt')), 'ultimoMensaje'],
      ],
      group: ['telefono'],
      order: [[Sequelize.fn('MAX', Sequelize.col('createdAt')), 'DESC']],
    });

    const clientes = await Cliente.findAll();

    const resultado = conversaciones.map(conv => {
      const cliente = clientes.find(c =>
        normalizarTelefono(c.telefono) === normalizarTelefono(conv.telefono)
      );
      return {
        telefono: conv.telefono,
        ultimoMensaje: conv.dataValues.ultimoMensaje,
        cliente: cliente
          ? { nombre: cliente.nombre || cliente.razonSocial || cliente.email }
          : null
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('❌ Error al listar últimos mensajes por cliente:', error);
    next(error);
  }
};

// GET /conversaciones/agrupadas
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

    const clientes = await Cliente.findAll();
    const agrupadas = {};

    for (const conv of conversaciones) {
      const tel = conv.telefono;
      const telNorm = normalizarTelefono(tel);

      if (!agrupadas[tel]) {
        const cliente = clientes.find(c =>
          normalizarTelefono(c.telefono) === telNorm
        );

        agrupadas[tel] = {
          telefono: tel,
          cliente: cliente
            ? { nombre: cliente.nombre || cliente.razonSocial || cliente.email }
            : undefined,
          historial: []
        };
      }

      agrupadas[tel].historial.push({
        mensajeCliente: conv.mensajeCliente,
        respuestaBot: conv.respuestaBot,
        derivar: conv.derivar,
        createdAt: conv.createdAt,
      });
    }

    res.json({ data: Object.values(agrupadas) });

  } catch (error) {
    console.error('❌ Error al agrupar conversaciones:', error);
    next(error);
  }
};

// POST /conversaciones/responder
export const responderManual = async (req, res, next) => {
  try {
    const { telefono, mensaje } = req.body;
    if (!telefono || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const telefonoNormalizado = normalizarTelefono(telefono);
    const clientes = await Cliente.findAll();

    const cliente = clientes.find(c =>
      normalizarTelefono(c.telefono) === telefonoNormalizado
    );

    const conversacion = await ConversacionBot.create({
      telefono,
      mensajeCliente: '',
      respuestaBot: mensaje,
      derivar: false,
      manual: true,
      clienteId: cliente?.id || null,
    });

    if (cliente) {
      console.log(`✅ Se respondió a un cliente: ${cliente.nombre || cliente.razonSocial || cliente.email}`);
    } else {
      console.log('ℹ️ Número no corresponde a ningún cliente registrado.');
    }

    await enviarMensajeTextoLibreWhatsapp(telefono, mensaje);

    res.json({ ok: true, conversacion, esCliente: !!cliente });
  } catch (err) {
    console.error('❌ Error al guardar respuesta manual:', err);
    next(err);
  }
};
