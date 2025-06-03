import { Notificacion } from '@/models';
import { Op } from 'sequelize';

export const obtenerNotificaciones = async (req, res, next) => {
  try {
    const usuarioId = req.usuario?.id;

    const notificaciones = await Notificacion.findAll({
      where: {
        [Op.or]: [
          { usuarioId },
          { usuarioId: null },
        ],
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
      attributes: ['id', 'titulo', 'mensaje', 'leida', 'createdAt', 'pedidoId'] // ✅ importante
    });

    res.json(notificaciones);
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    next(error);
  }
};

export const marcarComoLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) return res.status(404).json({ message: 'Notificación no encontrada' });

    await notificacion.update({ leida: true });
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('❌ Error al marcar como leída:', error);
    next(error);
  }
};

export const eliminarNotificacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificacion = await Notificacion.findByPk(id);

    if (!notificacion) return res.status(404).json({ message: 'Notificación no encontrada' });

    await notificacion.destroy();
    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('❌ Error al eliminar notificación:', error);
    next(error);
  }
};

export const crearNotificacion = async (req, res, next) => {
  try {
    const { mensaje, titulo, tipo, usuarioId = null, pedidoId = null } = req.body;

    if (!mensaje || !titulo) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const notificacion = await Notificacion.create({
      mensaje,
      titulo,
      tipo,
      usuarioId,
      pedidoId,
    });

    res.status(201).json({ message: 'Notificación creada', notificacion });
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    next(error);
  }
};
