import api from './api';
import type {
  ResumenProduccion,
  ResumenProduccionPlanta,
  ResumenProduccionCategoria,
  ResumenProduccionTurno,
  ResumenProduccionGeneral,
  EvolucionProduccion
} from "@/types/grafico";

export async function fetchResumenProduccion(params: any): Promise<any> {
  const { data } = await api.get("/graficos/produccion/resumen", { params });
  return data;
}

export async function fetchResumenProduccionPorPlanta(params: any): Promise<ResumenProduccionPlanta[]> {
  const { data } = await api.get("/graficos/produccion/resumen-planta", { params });
  return data;
}

export async function fetchResumenProduccionPorCategoria(params: any): Promise<ResumenProduccionCategoria[]> {
  const { data } = await api.get("/graficos/produccion/resumen-categoria", { params });
  return data;
}

export async function fetchResumenProduccionPorTurno(params: any): Promise<ResumenProduccionTurno[]> {
  const { data } = await api.get("/graficos/produccion/resumen-turno", { params });
  return data;
}

export async function fetchResumenProduccionGeneral(params: any): Promise<ResumenProduccionGeneral> {
  const { data } = await api.get("/graficos/produccion/resumen-general", { params });
  return data;
}

// 🆕 Evolución de producción
export async function fetchResumenProduccionEvolucion(params: any): Promise<EvolucionProduccion[]> {
  const { data } = await api.get("/graficos/produccion/evolucion", { params });
  return data;
}
