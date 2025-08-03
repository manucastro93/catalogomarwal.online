import { number } from 'zod';
import api from './api';
import type { Operario } from '@/types/operario';

export const obtenerOperarios = async () => {
  const { data } = await api.get('/operarios', { params: { limit: 100 } });
  return data.data;
};

export const buscarOperariosPorTexto = async (texto: string, rubroId: number) => {
  if (!texto) return [];
  const { data } = await api.get('/operarios', {
    params: { buscar: texto, rubroId, limit: 15 }
  });
  return data.data;
};

export const crearOperario = async (operario: Partial<Operario>) => {
  const { data } = await api.post('/operarios', operario);
  return data;
};

export const editarOperario = async (id: number, operario: Partial<Operario>) => {
  const { data } = await api.put(`/operarios/${id}`, operario);
  return data;
};

export const eliminarOperario = async (id: number) => {
  const { data } = await api.delete(`/operarios/${id}`);
  return data;
};
