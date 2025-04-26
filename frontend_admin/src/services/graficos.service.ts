import api from './api';

import type {
  ResumenProduccion,
  ResumenProduccionPlanta,
  ResumenProduccionCategoria,
  ResumenProduccionTurno,
  ResumenProduccionGeneral
} from "../types/graficos";

export async function fetchResumenProduccion(params: { desde: string, hasta: string }): Promise<ResumenProduccion[]> {
    const { data } = await api.get("/graficos/produccion/resumen", { params });
    return data;
  }
  
  export async function fetchResumenProduccionPorPlanta(params: { desde: string, hasta: string }): Promise<ResumenProduccionPlanta[]> {
    const { data } = await api.get("/graficos/produccion/resumen-planta", { params });
    return data;
  }
  
  export async function fetchResumenProduccionPorCategoria(params: { desde: string, hasta: string }): Promise<ResumenProduccionCategoria[]> {
    const { data } = await api.get("/graficos/produccion/resumen-categoria", { params });
    return data;
  }
  
  export async function fetchResumenProduccionPorTurno(params: { desde: string, hasta: string }): Promise<ResumenProduccionTurno[]> {
    const { data } = await api.get("/graficos/produccion/resumen-turno", { params });
    return data;
  }
  
  export async function fetchResumenProduccionGeneral(params: { desde: string, hasta: string }): Promise<ResumenProduccionGeneral> {
    const { data } = await api.get("/graficos/produccion/resumen-general", { params });
    return data;
  }
  