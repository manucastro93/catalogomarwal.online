import { ReporteProduccionInyeccionEncabezado, ReportesProduccionesInyeccion, Usuario, Operario, Maquina, Pieza, LogAuditoria } from "../models/index.js";
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
    if (req.query.desde && req.query.hasta) {
      const desde = new Date(req.query.desde + 'T00:00:00');
      const hasta = new Date(req.query.hasta + 'T23:59:59');
      where.fecha = { [Op.between]: [desde, hasta] };
    }
    let order = [[orden, direccion]];

    // Traer encabezados con detalles y operarios/maquinas/piezas
    const { count, rows } = await ReporteProduccionInyeccionEncabezado.findAndCountAll({
      where,
      include: [
        {
          model: ReportesProduccionesInyeccion,
          as: "Detalles", // Alias del hasMany en el modelo
          include: [
            { model: Operario, as: "Operario" },
            { model: Maquina, as: "Maquina" },
            { model: Pieza, as: "Pieza" },
          ]
        },
        { model: Usuario, as: "Usuario", attributes: ["id", "nombre", "email"] },
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
    const { fecha, turno, usuarioId, nota, detalles } = req.body;
    if (!fecha || !turno || !usuarioId || !detalles?.length) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    // 1. Crear encabezado
    const encabezado = await ReporteProduccionInyeccionEncabezado.create({
      fecha, turno, usuarioId, nota,
    });

    // 2. Crear los detalles (detalle = { operarioId, maquinaId, piezaId, horaDesde, horaHasta, cantidad })
    await Promise.all(detalles.map(d =>
      ReportesProduccionesInyeccion.create({
        reporteProduccionInyeccionEncabezadoId: encabezado.id,
        operarioId: d.operarioId,
        maquinaId: d.maquinaId,
        piezaId: d.piezaId,
        horaDesde: d.horaDesde,
        horaHasta: d.horaHasta,
        cantidad: d.cantidad,
      })
    ));

    // 3. Auditoría 
    await crearAuditoria({
      tabla: "ReporteProduccionInyeccionEncabezado",
      accion: "crear",
      registroId: encabezado.id,
      usuarioId: encabezado.usuarioId,
      descripcion: `Creación de reporte de producción inyección (fecha: ${fecha}, turno: ${turno})`,
      datosAntes: null,
      datosDespues: encabezado.toJSON(),
      ip: req.ip,
    });

    res.json({ ok: true, encabezadoId: encabezado.id });
  } catch (error) {
    next(error);
  }
};

export const eliminarReporteProduccion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Traer el encabezado y detalles antes de borrar (para auditar)
    const encabezado = await ReporteProduccionInyeccionEncabezado.findByPk(id, {
      include: [
        {
          model: ReportesProduccionesInyeccion,
          as: "Detalles",
        },
      ],
    });

    if (!encabezado) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }

    // Auditar antes de borrar
    await crearAuditoria({
      tabla: "ReporteProduccionInyeccionEncabezado",
      accion: "eliminar",
      registroId: id,
      usuarioId: req.usuario?.id || encabezado.usuarioId,
      descripcion: `Eliminación de reporte de producción inyección con id ${id}`,
      datosAntes: encabezado.toJSON(),
      datosDespues: null,
      ip: req.ip,
    });

    // Borrar el encabezado (los detalles caen en cascada)
    await ReporteProduccionInyeccionEncabezado.destroy({ where: { id } });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
