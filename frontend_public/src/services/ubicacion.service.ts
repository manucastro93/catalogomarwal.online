import api from './api';
import type { DireccionGoogle } from "@/types/ubicacion";

// Provincias
export const obtenerProvincias = async () => {
  const res = await api.get('/provincias');
  return res.data;
};

// Localidades por provincia
export const obtenerLocalidades = async (provinciaId: number) => {
  if (!provinciaId) return [];
  const res = await api.get(`/provincia/${provinciaId}/localidades`);
  return res.data;
};

// Búsqueda de localidades por texto
export const buscarLocalidades = async (texto: string, provinciaId: number) => {
  if (!texto || !provinciaId) return [];
  const res = await api.get('/localidades', {
    params: {
      q: texto,
      provinciaId,
    },
  });
  return res.data;
};

// Detalle de dirección desde Google (place_id)
export const obtenerDetalleDireccion = async (place_id: string): Promise<DireccionGoogle> => {
  const res = await api.get('/direccion-detalle', {
    params: { place_id },
  });
  return res.data;
};

// Sugerencias de dirección (autocomplete)
export const obtenerSugerenciasDireccion = async (query: string): Promise<DireccionGoogle[]> => {
  const res = await api.get('/autocomplete', {
    params: { q: query },
  });
  return (res.data.predictions || []).map((p: any) => ({
    descripcion: p.description,
    place_id: p.place_id,
  }));
};
