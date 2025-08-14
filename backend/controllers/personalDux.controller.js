import { PersonalDux } from "../models/index.js";

export const listarPersonalDux = async (req, res, next) => {
  try {
    const vendedores = await PersonalDux.findAll({
      order: [["nombre", "ASC"]],
    });

    res.json(vendedores);
  } catch (error) {
    console.error("❌ Error al listar Personal Dux:", error);
    next(error);
  }
};
