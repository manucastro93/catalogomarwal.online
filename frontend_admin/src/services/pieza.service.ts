import api from './api';
import type { Pieza } from '@/types/pieza';

export const obtenerPiezas = async (params :any) => {
  const { data } = await api.get('/piezas', { params });
  return data;
};

export const crearPieza = async (pieza: Partial<Pieza>) => {
  const { data } = await api.post('/piezas', pieza);
  return data;
};

export const editarPieza = async (id: number, pieza: Partial<Pieza>) => {
  const { data } = await api.put(`/piezas/${id}`, pieza);
  return data;
};

export const eliminarPieza = async (id: number) => {
  const { data } = await api.delete(`/piezas/${id}`);
  return data;
};

export const obtenerPiezaPorId = async (id: number) => {
  const { data } = await api.get(`/piezas/${id}`);
  return data;
};

export const buscarPiezasPorTexto = async (texto: string): Promise<Pieza[]> => {
  const { data } = await api.get('/piezas', {
    params: { buscar: texto, limit: 20 },
  });
  return data.data || [];
};
