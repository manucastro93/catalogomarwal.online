import { ReporteProduccion, Producto, Categoria, Planta } from "../models/index.js";
import { Op, fn, col } from "sequelize";

// 📋 Helper para armar where dinámico
const construirWhere = (query) => {
  const where = {};

  if (query.desde && query.hasta) {
    where.fecha = {
      [Op.between]: [new Date(query.desde), new Date(query.hasta)]
    };
  }

  if (query.turno) {
    where.turno = query.turno;
  }

  if (query.plantaId) {
    where.plantaId = query.plantaId;
  }

  return where;
};

// 📋 Helper para agregar filtro de categoría (Producto -> Categoria)
const construirIncludeProducto = (query) => {
  const includeProducto = {
    model: Producto,
    as: "producto",
    attributes: ["costoMP", "precioUnitario"],
    include: {
      model: Categoria,
      as: "Categoria",
      attributes: ["nombre"]
    }
  };

  if (query.categoriaId) {
    includeProducto.where = { categoriaId: query.categoriaId };
  }

  return includeProducto;
};

// 📊 Resumen de producción diaria (tabla principal)
export const obtenerResumenProduccion = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);

    const reportes = await ReporteProduccion.findAll({
      where,
      include: [
        includeProducto,
        {
          model: Planta,
          as: "planta",
          attributes: ["nombre"]
        }
      ],
      raw: true,
      nest: true
    });

    const resultado = reportes.map((reporte) => ({
      fecha: reporte.fecha ? new Date(reporte.fecha).toISOString().split('T')[0] : '',
      planta: reporte.planta?.nombre ?? "Sin Planta",
      categoria: reporte.producto?.Categoria?.nombre ?? "Sin Categoría",
      turno: reporte.turno ?? "Sin Turno",
      totalCostoMP: (Number(reporte.producto?.costoMP) || 0) * (Number(reporte.cantidad) || 0),
      totalPrecioUnitario: (Number(reporte.producto?.precioUnitario) || 0) * (Number(reporte.cantidad) || 0),
    }));

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// 🏭 Producción por planta (gráfico barras)
export const obtenerResumenPorPlanta = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);

    const reportes = await ReporteProduccion.findAll({
      where,
      include: [
        includeProducto,
        {
          model: Planta,
          as: "planta",
          attributes: ["nombre"]
        }
      ],
      raw: true,
      nest: true
    });

    const resumenPorPlanta = {};

    for (const reporte of reportes) {
      const plantaNombre = reporte.planta?.nombre ?? "Sin Planta";

      if (!resumenPorPlanta[plantaNombre]) {
        resumenPorPlanta[plantaNombre] = { totalCostoMP: 0, totalPrecioUnitario: 0 };
      }

      resumenPorPlanta[plantaNombre].totalCostoMP += (Number(reporte.producto?.costoMP) || 0) * (Number(reporte.cantidad) || 0);
      resumenPorPlanta[plantaNombre].totalPrecioUnitario += (Number(reporte.producto?.precioUnitario) || 0) * (Number(reporte.cantidad) || 0);
    }

    const resultado = Object.entries(resumenPorPlanta).map(([planta, totales]) => ({
      planta,
      ...totales
    }));

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// 📂 Producción por categoría (gráfico torta)
export const obtenerResumenPorCategoria = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);

    const reportes = await ReporteProduccion.findAll({
      where,
      include: [includeProducto],
      raw: true,
      nest: true
    });

    const resumenPorCategoria = {};

    for (const reporte of reportes) {
      const categoriaNombre = reporte.producto?.Categoria?.nombre ?? "Sin Categoría";

      if (!resumenPorCategoria[categoriaNombre]) {
        resumenPorCategoria[categoriaNombre] = { totalPrecioUnitario: 0 };
      }

      resumenPorCategoria[categoriaNombre].totalPrecioUnitario += (Number(reporte.producto?.precioUnitario) || 0) * (Number(reporte.cantidad) || 0);
    }

    const resultado = Object.entries(resumenPorCategoria).map(([categoria, totales]) => ({
      categoria,
      ...totales
    }));

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// 🕒 Producción por turno (gráfico barras)
export const obtenerResumenPorTurno = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);

    const reportes = await ReporteProduccion.findAll({
      where,
      include: [includeProducto],
      raw: true,
      nest: true
    });

    const resumenPorTurno = {};

    for (const reporte of reportes) {
      const turnoNombre = reporte.turno ?? "Sin Turno";

      if (!resumenPorTurno[turnoNombre]) {
        resumenPorTurno[turnoNombre] = { totalPrecioUnitario: 0 };
      }

      resumenPorTurno[turnoNombre].totalPrecioUnitario += (Number(reporte.producto?.precioUnitario) || 0) * (Number(reporte.cantidad) || 0);
    }

    const resultado = Object.entries(resumenPorTurno).map(([turno, totales]) => ({
      turno,
      ...totales
    }));

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// 📈 Totales generales (panel superior)
export const obtenerResumenGeneral = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);

    const reportes = await ReporteProduccion.findAll({
      where,
      include: [includeProducto],
      raw: true,
      nest: true
    });

    let totalCostoMP = 0;
    let totalPrecioUnitario = 0;

    for (const reporte of reportes) {
      totalCostoMP += (Number(reporte.producto?.costoMP) || 0) * (Number(reporte.cantidad) || 0);
      totalPrecioUnitario += (Number(reporte.producto?.precioUnitario) || 0) * (Number(reporte.cantidad) || 0);
    }

    res.json({
      totalCostoMP,
      totalPrecioUnitario,
    });
  } catch (error) {
    next(error);
  }
};
