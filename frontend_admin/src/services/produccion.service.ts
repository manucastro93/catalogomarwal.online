import api from "./api";
import { CrearReporteProduccion, ProduccionParams } from "../types/produccion";

export const obtenerReportesProduccion = async (params: ProduccionParams) => {
  const { data } = await api.get("/produccion-diaria", { params });
  return data;
};

export const guardarReporteProduccion = async (reporte: CrearReporteProduccion) => {
  const { data } = await api.post("/produccion-diaria", reporte);
  return data;
};
  
export const eliminarReporteProduccion = async (id: number) => {
  const { data } = await api.delete(`/produccion-diaria/reportes-produccion/${id}`);
  return data;
};