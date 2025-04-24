import { ReporteProduccion, Producto, Usuario, LogAuditoria, Planta } from "../models/index.js";
import { Op } from "sequelize";

export const obtenerReportesProduccion = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limit;
    const orden = req.query.orden || "createdAt";
    const direccion = req.query.direccion?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const where = {};

    if (req.query.turno) {
      where.turno = req.query.turno;
    }

    if (req.query.plantaId) {
      where.plantaId = req.query.plantaId;
    }

    if (req.query.desde && req.query.hasta) {
      where.createdAt = {
        [Op.between]: [new Date(req.query.desde), new Date(req.query.hasta)],
      };
    }

    const { count, rows } = await ReporteProduccion.findAndCountAll({
      where,
      include: [
        { model: Producto, as: "producto" },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
        { model: Planta, as: "planta", attributes: ["id", "nombre", "direccion"] }
      ],
      order: [[orden, direccion]],
      limit,
      offset,
    });

    const totalPaginas = Math.ceil(count / limit);

    res.json({
      data: rows,
      total: count,
      pagina,
      totalPaginas,
    });
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