import { Op, Sequelize } from "sequelize";
import {
  ComprobantesServicios,
  ProveedoresServicios,
  CategoriasServicios,
} from "../models/index.js";
// Opcional: si tenés auditoría, descomentá la siguiente línea
// import { crearAuditoria } from "../utils/auditoria.js";

/**
 * GET /comprobantes-servicios
 * Query params soportados:
 *  - page (default 1), limit (default 10)
 *  - orden (campo, default "id"), direccion ("asc"|"desc")
 *  - desde, hasta (rango sobre fecha)
 *  - desdeImputacion, hastaImputacion (rango sobre fechaImputacion)
 *  - proveedorId, categoriaId (num)
 *  - tipoComprobante, estadoFacturacion (string)
 *  - conSaldo (true/false) -> saldo > 0
 *  - q (búsqueda texto: comprobante|detalles|observaciones|personal)
 */
export const obtenerComprobantesServicios = async (req, res, next) => {
  try {
    const pagina = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (pagina - 1) * limit;

    const ordenarPor = req.query.orden || "id";
    const direccion = req.query.direccion?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const where = {};
    const isValidDate = (s) => !isNaN(Date.parse(s));

    // Rango por "fecha"
    if (isValidDate(req.query.desde) && isValidDate(req.query.hasta)) {
      where.fecha = {
        [Op.between]: [
          new Date(req.query.desde + "T00:00:00"),
          new Date(req.query.hasta + "T23:59:59"),
        ],
      };
    } else if (isValidDate(req.query.desde)) {
      where.fecha = { [Op.gte]: new Date(req.query.desde + "T00:00:00") };
    } else if (isValidDate(req.query.hasta)) {
      where.fecha = { [Op.lte]: new Date(req.query.hasta + "T23:59:59") };
    }

    // Rango por "fechaImputacion" (independiente)
    if (isValidDate(req.query.desdeImputacion) || isValidDate(req.query.hastaImputacion)) {
      where.fechaImputacion = {};
      if (isValidDate(req.query.desdeImputacion))
        where.fechaImputacion[Op.gte] = new Date(req.query.desdeImputacion + "T00:00:00");
      if (isValidDate(req.query.hastaImputacion))
        where.fechaImputacion[Op.lte] = new Date(req.query.hastaImputacion + "T23:59:59");
    }

    // Filtros directos
    if (req.query.proveedorId && !isNaN(Number(req.query.proveedorId))) {
      where.proveedorId = Number(req.query.proveedorId);
    }
    if (req.query.categoriaId && !isNaN(Number(req.query.categoriaId))) {
      where.categoriaId = Number(req.query.categoriaId);
    }
    if (req.query.tipoComprobante) {
      where.tipoComprobante = req.query.tipoComprobante;
    }
    if (req.query.estadoFacturacion) {
      where.estadoFacturacion = req.query.estadoFacturacion;
    }

    // conSaldo=true => saldo > 0
    if (String(req.query.conSaldo).toLowerCase() === "true") {
      where.saldo = { [Op.gt]: 0 };
    }

    // Búsqueda de texto libre
    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        where[Op.or] = [
          { comprobante: { [Op.like]: `%${q}%` } },
          { detalles: { [Op.like]: `%${q}%` } },
          { observaciones: { [Op.like]: `%${q}%` } },
          { personal: { [Op.like]: `%${q}%` } },
        ];
      }
    }

    // Ordenamiento
    let order = [];
    if (ordenarPor === "proveedor.nombre") {
      order = [[{ model: ProveedoresServicios, as: "proveedor" }, "nombre", direccion]];
    } else if (ordenarPor === "categoria.nombre") {
      order = [[{ model: CategoriasServicios, as: "categoria" }, "nombre", direccion]];
    } else {
      order = [[ordenarPor, direccion]];
    }

    // COUNT
    const total = await ComprobantesServicios.count({ where, paranoid: true });

    // FINDALL
    const rows = await ComprobantesServicios.findAll({
      where,
      include: [
        {
          model: ProveedoresServicios,
          as: "proveedor",
          attributes: ["id", "nombre", "cuit", "codigo"],
          required: false,
        },
        {
          model: CategoriasServicios,
          as: "categoria",
          attributes: ["id", "nombre"],
          required: false,
        },
      ],
      order,
      limit,
      offset,
      paranoid: true,
    });

    const totalPaginas = Math.ceil(total / limit);

    res.json({ data: rows, total, pagina, totalPaginas });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /comprobantes-servicios/:id
 */
export const obtenerComprobanteServicioPorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const row = await ComprobantesServicios.findByPk(id, {
      include: [
        { model: ProveedoresServicios, as: "proveedor", attributes: ["id", "nombre", "cuit", "codigo"] },
        { model: CategoriasServicios, as: "categoria", attributes: ["id", "nombre"] },
      ],
      paranoid: true,
    });

    if (!row) return res.status(404).json({ message: "Comprobante no encontrado" });
    res.json(row);
  } catch (error) {
    next(error);
  }
};

