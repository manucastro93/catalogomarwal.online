import { PersonalDux } from "../models/index.js";

export const listarPersonalDux = async (req, res, next) => {
  try {
    const vendedores = await PersonalDux.findAll({
      attributes: ["id_personal", "nombre", "apellido_razon_social"],
      order: [["nombre", "ASC"]],
    });

    const data = vendedores.map((v) => ({
      id: v.id_personal,
      nombre: v.nombre,
      apellido_razon_social: v.apellido_razon_social ?? "",
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error al listar Personal Dux:", error);
    next(error);
  }
};
