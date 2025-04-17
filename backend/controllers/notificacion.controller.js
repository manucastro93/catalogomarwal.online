import { Notificacion, Usuario } from '../models/index.js';
import { Op } from 'sequelize';

export const crearNotificacion = async (req, res, next) => {
  try {
    const { titulo, mensaje, tipo = 'general', usuarioId = null } = req.body;

    const notificacion = await Notificacion.create({
      titulo,
      mensaje,
      tipo,
      usuarioId,
    });

    res.status(201).json(notificacion);
  } catch (error) {
    next(error);
  }
};

export const obtenerNotificaciones = async (req, res, next) => {
  try {
    const usuarioId = req.usuario?.id;
    const notificaciones = await Notificacion.findAll({
      where: {
        [Op.or]: [
          { usuarioId },
          { usuarioId: null }, // notificaciones generales
        ],
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
    });

    res.json(notificaciones);
  } catch (error) {
    next(error);
  }
};

export const marcarComoLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) return res.status(404).json({ message: 'No encontrada' });

    await notificacion.update({ leida: true });
    res.json({ message: 'Marcada como leída' });
  } catch (error) {
    next(error);
  }
};
