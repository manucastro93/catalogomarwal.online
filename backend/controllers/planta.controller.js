import { Planta } from "../models/index.js";

export const obtenerPlantas = async (req, res, next) => {
  try {
    const plantas = await Planta.findAll({
      attributes: ["id", "nombre", "direccion"],
      order: [["nombre", "ASC"]],
    });
    res.json(plantas);
  } catch (error) {
    next(error);
  }
};
