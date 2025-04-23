import { ReporteProduccion, Producto, Usuario } from "../models/index.js";

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
