import { ReporteProduccion, Producto, Usuario, LogAuditoria, Planta } from '@/models';
import { Op } from "sequelize";
import { crearAuditoria } from "@/utils/auditoria";

export const obtenerReportesProduccion = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limit;
    const orden = req.query.orden || "fecha";
    const direccion = req.query.direccion?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const where = {};

    if (req.query.turno) {
      where.turno = req.query.turno;
    }

    if (req.query.plantaId) {
      where.plantaId = req.query.plantaId;
    }

    if (req.query.desde && req.query.hasta) {
      const desde = new Date(req.query.desde + 'T00:00:00');
      const hasta = new Date(req.query.hasta + 'T23:59:59');
      where.fecha = {
        [Op.between]: [new Date(desde), new Date(hasta)],
      };
    }

    let order;
    if (orden.includes(".")) {
      const partes = orden.split(".");
      order = [[...partes, direccion]];
    } else {
      order = [[orden, direccion]];
    }


    const { count, rows } = await ReporteProduccion.findAndCountAll({
      where,
      include: [
        { model: Producto, as: "producto" },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
        { model: Planta, as: "planta", attributes: ["id", "nombre", "direccion"] }
      ],
      order,
      limit,
      offset,
    });

    const totalPaginas = Math.ceil(count / limit);

    reson({
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
    const { productoId, cantidad, plantaId, turno } = req.body;
    const usuarioId = req.usuario?.id || req.body.usuarioId;

    if (!productoId || !cantidad || !usuarioId) {
      return res.status(400)on({ mensaje: "Faltan datos obligatorios" });
    }

    const nuevo = await ReporteProduccion.create({
      productoId,
      cantidad,
      usuarioId,
      plantaId,
      turno,
    });
    
    await crearAuditoria({
      tabla: 'reporte produccion diaria',
      accion: 'crea reporte',
      registroId: nuevo.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó el reporte de producción con ID ${nuevo.id}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    

    reson(nuevo);
  } catch (error) {
    next(error);
  }
};

export const eliminarReporteProduccion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401)on({ mensaje: "Usuario no autenticado" });
    }

    // 1. Eliminar el reporte
    await ReporteProduccion.destroy({ where: { id } });

    await crearAuditoria({
      tabla: 'reporte produccion diaria',
      accion: 'elimina reporte',
      registroId: id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se eliminó el reporte de producción con ID ${id}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    reson({ mensaje: "Reporte eliminado y registrado correctamente" });
  } catch (error) {
    next(error);
  }
};
