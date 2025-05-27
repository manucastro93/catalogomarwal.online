import { ConversacionBot } from '../models/index.js';
import { Op } from 'sequelize';

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
