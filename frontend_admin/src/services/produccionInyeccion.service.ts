import api from "./api";
import type { 
  CrearReporteProduccionInyeccionEncabezado, 
  ProduccionInyeccionParams 
} from "@/types/produccionInyeccion";

// Obtener lista de reportes (encabezados con sus detalles)
export const obtenerReportesProduccion = async (params: ProduccionInyeccionParams) => {
  const { data } = await api.get("/inyeccion/produccion-diaria", { params });
  return data;
};

// Crear un reporte de producción (encabezado + array de detalles)
export const guardarReporteProduccionInyeccionEncabezado = async (reporte: CrearReporteProduccionInyeccionEncabezado) => {
  const { data } = await api.post("/inyeccion/produccion-diaria", reporte);
  return data;
};

// Eliminar un reporte de producción (por id de encabezado)
export const eliminarReporteProduccionEncabezado = async (id: number) => {
  const { data } = await api.delete(`/inyeccion/produccion-diaria/${id}`);
  return data;
};
