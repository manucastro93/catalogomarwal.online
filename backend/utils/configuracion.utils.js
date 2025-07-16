import { ConfiguracionSistema } from "../models/index.js";

export const obtenerConfiguracionPorClave = async (clave) => {
  const configuracion = await ConfiguracionSistema.findOne({ where: { clave } });
  return configuracion;
};
