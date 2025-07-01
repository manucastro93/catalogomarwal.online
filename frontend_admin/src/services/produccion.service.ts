import api from "./api";
import type { 
  CrearReporteProduccionEncabezado, 
  ProduccionParams 
} from "@/types/produccion";

// Obtener lista de reportes (encabezados con sus productos)
export const obtenerReportesProduccion = async (params: ProduccionParams) => {
  const { data } = await api.get("/produccion-diaria", { params });
  return data;
};

// Crear un reporte de producción (encabezado + array de productos)
export const guardarReporteProduccionEncabezado = async (reporte: CrearReporteProduccionEncabezado) => {
  const { data } = await api.post("/produccion-diaria", reporte);
  return data;
};

// Eliminar un reporte de producción (por id de encabezado)
export const eliminarReporteProduccionEncabezado = async (id: number) => {
  const { data } = await api.delete(`/produccion-diaria/${id}`);
  return data;
};
