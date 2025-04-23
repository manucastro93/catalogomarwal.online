import { ReporteProduccion, Producto, Usuario, LogAuditoria } from "../models/index.js";

export const obtenerReportesProduccion = async (req, res, next) => {
  try {
    const reportes = await ReporteProduccion.findAll({
      include: [
        { model: Producto, as: "producto" },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(reportes);
  } catch (error) {
    next(error);
  }
};

export const crearReporteProduccion = async (req, res, next) => {
  try {
    const { productoId, cantidad } = req.body;
    const usuarioId = req.usuario?.id || req.body.usuarioId;

    if (!productoId || !cantidad || !usuarioId) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const nuevo = await ReporteProduccion.create({
      productoId,
      cantidad,
      usuarioId,
    });

    res.json(nuevo);
  } catch (error) {
    next(error);
  }
};

export const eliminarReporteProduccion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    // 1. Eliminar el reporte
    await ReporteProduccion.destroy({ where: { id } });

    // 2. Registrar la auditoría
    await LogAuditoria.create({
      tabla: "ReporteProduccion",
      accion: "eliminado",
      registroId: id,
      usuarioId,
    });

    res.json({ mensaje: "Reporte eliminado y registrado correctamente" });
  } catch (error) {
    next(error);
  }
};