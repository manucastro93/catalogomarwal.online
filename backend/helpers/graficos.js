import { Producto, Categoria } from "../models/index.js";
import { Op } from "sequelize";

export function construirWhere(query) {
  const where = {};

  if (query.desde && query.hasta) {
    const desdeValido = !isNaN(new Date(query.desde).getTime());
    const hastaValido = !isNaN(new Date(query.hasta).getTime());

    if (desdeValido && hastaValido) {
      where.fecha = {
        [Op.between]: [
          new Date(`${query.desde}T00:00:00`),
          new Date(`${query.hasta}T23:59:59`)
        ]
      };
    }
  }

  if (query.turno) {
    where.turno = query.turno;
  }
  if (query.plantaId) {
    where.plantaId = query.plantaId;
  }

  return where;
}


export function construirIncludeProducto(query) {
  
  const includeProducto = {
    model: Producto,
    as: "producto",
    attributes: ["id", "nombre", "sku", "costoDux", "precioUnitario"],
    include: {
      model: Categoria,
      as: "Categoria",
      attributes: ["id", "nombre"]
    }
  };

  const filtro = {};
  if (query.categoriaId) {
    filtro.categoriaId = query.categoriaId;
  }
  if (query.producto) {
    filtro[Op.or] = [
      { nombre: { [Op.like]: `%${query.producto}%` } },
      { sku:    { [Op.like]: `%${query.producto}%` } }
    ];
    
    
  }
  if (Object.keys(filtro).length > 0) {
    includeProducto.where = filtro;
    includeProducto.required = true;
  }
  return includeProducto;
}
