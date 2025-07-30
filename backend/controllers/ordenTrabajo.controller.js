import { OrdenTrabajo, DetalleOrdenTrabajo, Producto, Usuario, Planta, ReporteProduccionEncabezado } from "../models/index.js";
import { Op } from "sequelize";
import { crearAuditoria } from "../utils/auditoria.js";

export const obtenerOrdenesTrabajo = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const ordenarPor = req.query.orden || "id";
    const direccion = req.query.direccion === "desc" ? "DESC" : "ASC";
    const offset = (pagina - 1) * limit;
    const where = {};

    if (req.query.desde && req.query.hasta) {
      where.fecha = {
        [Op.between]: [
          new Date(req.query.desde + "T00:00:00"),
          new Date(req.query.hasta + "T23:59:59"),
        ],
      };
    } else if (req.query.desde) {
      where.fecha = { [Op.gte]: new Date(req.query.desde) };
    } else if (req.query.hasta) {
      where.fecha = { [Op.lte]: new Date(req.query.hasta + "T23:59:59") };
    }

    if (req.query.turno) {
      where.turno = req.query.turno;
    }

    if (req.query.plantaId) {
      const id = Number(req.query.plantaId);
      if (!isNaN(id)) {
        where.plantaId = id;
      }
    }

    if (req.query.estado) {
      where.estado = req.query.estado;
    }

    const { count, rows } = await OrdenTrabajo.findAndCountAll({
      where,
      include: [
        {
          model: DetalleOrdenTrabajo,
          as: "productos",
          include: [{ model: Producto, as: "producto" }]
        },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
        { model: Planta, as: "planta", attributes: ["id", "nombre", "direccion"] }
      ],
      order: [[ordenarPor, direccion]],
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

export const crearOrdenTrabajo = async (req, res, next) => {
  try {
    const { fecha, turno, plantaId, nota, productos } = req.body;
    const usuarioId = req.usuario?.id || req.body.usuarioId;

    if (!fecha || !turno || !plantaId || !usuarioId || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    // 1. Crear la orden principal
    const orden = await OrdenTrabajo.create({
      fecha,
      turno,
      plantaId,
      usuarioId,
      nota,
    });

    // 2. Agregar los productos (bulk create)
    const items = productos.map(item => ({
      ordenTrabajoId: orden.id,
      productoId: item.productoId,
      cantidad: item.cantidad,
    }));

    await DetalleOrdenTrabajo.bulkCreate(items);

    await crearAuditoria({
      tabla: 'ordenes_trabajo',
      accion: 'crea orden',
      registroId: orden.id,
      usuarioId: usuarioId,
      descripcion: `Se creó la orden de trabajo con ID ${orden.id}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    res.json(orden);
  } catch (error) {
    next(error);
  }
};

export const eliminarOrdenTrabajo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ mensaje: "Usuario no autenticado" });
    }

    // Eliminar productos asociados primero (onDelete: CASCADE recomendado en modelo)
    await DetalleOrdenTrabajo.destroy({ where: { ordenTrabajoId: id } });

    // Eliminar orden
    await OrdenTrabajo.destroy({ where: { id } });

    await crearAuditoria({
      tabla: 'ordenes_trabajo',
      accion: 'elimina orden',
      registroId: id,
      usuarioId: usuarioId,
      descripcion: `Se eliminó la orden de trabajo con ID ${id}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    res.json({ mensaje: "Orden de trabajo eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};

export const obtenerOrdenesTrabajoPendientes = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limit;
    const where = {};

    // Otros filtros
    if (req.query.desde) {
      where.fecha = { [Op.gte]: new Date(req.query.desde) };
    }
    if (req.query.hasta) {
      where.fecha = where.fecha
        ? { ...where.fecha, [Op.lte]: new Date(req.query.hasta) }
        : { [Op.lte]: new Date(req.query.hasta) };
    }
    if (req.query.turno) {
      where.turno = req.query.turno;
    }
    if (req.query.plantaId) {
      where.plantaId = req.query.plantaId;
    }

    // **Filtro clave: solo OTs sin reportes relacionados**
    where['$reportesProduccion.id$'] = null;

    const { count, rows } = await OrdenTrabajo.findAndCountAll({
      where,
      include: [
        {
          model: DetalleOrdenTrabajo,
          as: "productos",
          include: [{ model: Producto, as: "producto" }]
        },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
        { model: Planta, as: "planta", attributes: ["id", "nombre", "direccion"] },
        {
          model: ReporteProduccionEncabezado,
          as: "reportesProduccion",
          required: false,
          attributes: [],
        }
      ],
      order: [["fecha", "ASC"]],
      limit,
      offset,
      subQuery: false, // Esencial para filtrar por includes
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
