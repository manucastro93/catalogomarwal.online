import { ReporteProduccion, Planta } from "../models/index.js";
import { construirWhere, construirIncludeProducto } from "../helpers/graficos.js";
import dayjs from "dayjs";

// Resumen tabla
export const obtenerResumenProduccion = async (req, res, next) => {
  try {
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||10;
    const offset = (page-1)*limit;
    const { count, rows } = await ReporteProduccion.findAndCountAll({
      where,
      include: [
        includeProducto,
        { model: Planta, as: "planta", attributes: ["nombre"] }
      ],
      order:[["fecha","DESC"]],
      limit, offset,
      raw:true, nest:true
    });
    const items = rows.map(r=>({
      fecha: r.fecha? dayjs(r.fecha).format("DD/MM/YYYY"):"",
      planta: r.planta?.nombre||"Sin Planta",
      categoria: r.producto?.Categoria?.nombre||"Sin Categoría",
      producto:{ id:r.producto?.id||null, nombre:r.producto?.nombre||"Sin Producto", sku:r.producto?.sku||"Sin SKU" },
      turno: r.turno||"Sin Turno",
      cantidad: r.cantidad||0,
      totalCostoDux: (Number(r.producto?.costoDux)||0)*(r.cantidad||0),
      totalValor:    (Number(r.producto?.precioUnitario)||0)*(r.cantidad||0)
    }));
    res.json({ items, totalItems:count, totalPages:Math.ceil(count/limit), currentPage:page });
  } catch(e){ next(e) }
};

// Producción por Planta
export const obtenerResumenProduccionPorPlanta = async (req,res,next)=>{
  try{
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);
    const rows = await ReporteProduccion.findAll({
      where,
      include: [
        includeProducto,
        { model: Planta, as: "planta", attributes: ["nombre"] }
      ],
      raw:true, nest:true
    });
    const resumen = {};
    rows.forEach(r=>{
      const key = r.planta?.nombre||"Sin Planta";
      if(!resumen[key]) resumen[key]={ planta:key, totalCantidad:0, totalCostoDux:0, totalValor:0 };
      resumen[key].totalCantidad += r.cantidad||0;
      resumen[key].totalCostoDux += (Number(r.producto?.costoDux)||0)*(r.cantidad||0);
      resumen[key].totalValor    += (Number(r.producto?.precioUnitario)||0)*(r.cantidad||0);
    });
    res.json(Object.values(resumen));
  }catch(e){ next(e) }
};

// Producción por Categoría
export const obtenerResumenProduccionPorCategoria = async (req,res,next)=>{
  try{
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);
    const rows = await ReporteProduccion.findAll({ where, include:[includeProducto], raw:true, nest:true });
    const resumen = {};
    rows.forEach(r=>{
      const key = r.producto?.Categoria?.nombre||"Sin Categoría";
      if(!resumen[key]) resumen[key]={ categoria:key, totalCantidad:0, totalCostoDux:0, totalValor:0 };
      resumen[key].totalCantidad += r.cantidad||0;
      resumen[key].totalCostoDux += (Number(r.producto?.costoDux)||0)*(r.cantidad||0);
      resumen[key].totalValor    += (Number(r.producto?.precioUnitario)||0)*(r.cantidad||0);
    });
    res.json(Object.values(resumen));
  }catch(e){ next(e) }
};

// Producción por Turno
export const obtenerResumenProduccionPorTurno = async (req,res,next)=>{
  try{
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);
    const rows = await ReporteProduccion.findAll({ where, include:[includeProducto], raw:true, nest:true });
    const resumen = {};
    rows.forEach(r=>{
      const key = r.turno||"Sin Turno";
      if(!resumen[key]) resumen[key]={ turno:key, totalCantidad:0, totalCostoDux:0, totalValor:0 };
      resumen[key].totalCantidad += r.cantidad||0;
      resumen[key].totalCostoDux += (Number(r.producto?.costoDux)||0)*(r.cantidad||0);
      resumen[key].totalValor    += (Number(r.producto?.precioUnitario)||0)*(r.cantidad||0);
    });
    res.json(Object.values(resumen));
  }catch(e){ next(e) }
};

// Resumen general
export const obtenerResumenProduccionGeneral = async (req,res,next)=>{
  try{
    const where = construirWhere(req.query);
    const includeProducto = construirIncludeProducto(req.query);
    const rows = await ReporteProduccion.findAll({ where, include:[includeProducto], raw:true, nest:true });
    let totalCantidad=0, totalCostoDux=0, totalValor=0;
    rows.forEach(r=>{
      totalCantidad += r.cantidad||0;
      totalCostoDux   += (Number(r.producto?.costoDux)||0)*(r.cantidad||0);
      totalValor     += (Number(r.producto?.precioUnitario)||0)*(r.cantidad||0);
    });
    res.json({ totalCantidad, totalCostoDux, totalValor });
  }catch(e){ next(e) }
};

// Evolución
export const obtenerEvolucionProduccion = async (req,res,next)=>{
  try{
    const { desde,hasta,turno,plantaId,categoriaId,producto } = req.query;
    if(!desde||!hasta) return res.status(400).json({ mensaje:"Fechas requeridas" });
    const where = construirWhere({ desde,hasta,turno,plantaId });
    const includeProducto = construirIncludeProducto({ categoriaId,producto });
    const rows = await ReporteProduccion.findAll({
      where,
      include:[includeProducto],
      attributes:["fecha","cantidad"],
      raw:true, nest:true
    });
    const start = dayjs(desde), end = dayjs(hasta), diff = end.diff(start,"day");
    const fmt = diff<=31?"DD/MM/YYYY":diff<=62?"[Semana] WW/YYYY":"MM/YYYY";
    const agg = {};
    rows.forEach(r=>{
      const key = fmt.includes("Semana")? dayjs(r.fecha).format("[Semana] WW/YYYY"): dayjs(r.fecha).format(fmt);
      if(!agg[key]) agg[key]={ totalCantidad:0, totalValor:0 };
      agg[key].totalCantidad += r.cantidad||0;
      agg[key].totalValor    += (Number(r.producto.precioUnitario)||0)*(r.cantidad||0);
    });
    const resultado = Object.entries(agg).map(([periodo,d])=>({ periodo, totalCantidad:d.totalCantidad, totalValor:d.totalValor }));
    res.json(resultado);
  }catch(e){ next(e) }
};
