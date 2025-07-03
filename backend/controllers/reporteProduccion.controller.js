import { ReporteProduccionEncabezado, ReporteProduccion, Producto, Usuario, LogAuditoria, Planta } from "../models/index.js";
import { Op } from "sequelize";
import { crearAuditoria } from "../utils/auditoria.js";

export const obtenerReportesProduccion = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limit;
    const orden = req.query.orden || "fecha";
    const direccion = req.query.direccion?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const where = {};

    if (req.query.turno) where.turno = req.query.turno;
    if (req.query.plantaId) where.plantaId = req.query.plantaId;
    if (req.query.desde && req.query.hasta) {
      const desde = new Date(req.query.desde + 'T00:00:00');
      const hasta = new Date(req.query.hasta + 'T23:59:59');
      where.fecha = { [Op.between]: [desde, hasta] };
    }

    let order = [[orden, direccion]];

    // Traer encabezados con detalles y sus productos
    const { count, rows } = await ReporteProduccionEncabezado.findAndCountAll({
      where,
      include: [
        {
          model: ReporteProduccion,
          as: "productos", // así lo definiste
          include: [{ model: Producto, as: "producto" }]
        },
        { model: Usuario, as: "usuario", attributes: ["id", "nombre", "email"] },
        { model: Planta, as: "planta", attributes: ["id", "nombre", "direccion"] }
      ],
      order,
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
    const { fecha, turno, usuarioId, plantaId, nota, productos } = req.body;
    if (!fecha || !turno || !usuarioId || !plantaId || !productos?.length) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    // 1. Crear encabezado
    const encabezado = await ReporteProduccionEncabezado.create({
      fecha, turno, usuarioId, plantaId, nota,
    });

    // 2. Crear los detalles
    await Promise.all(productos.map(p =>
      ReporteProduccion.create({
        reporteProduccionEncabezadoId: encabezado.id,
        productoId: p.productoId,
        cantidad: p.cantidad,
        usuarioId: encabezado.usuarioId,
        plantaId: encabezado.plantaId,
      })
    ));

    res.json({ ok: true, encabezadoId: encabezado.id });
  } catch (error) {
    next(error);
  }
};

export const eliminarReporteProduccion = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Borra el encabezado y los detalles caen en cascada
    await ReporteProduccionEncabezado.destroy({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
