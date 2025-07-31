import api from './api';
import type { Pieza } from '@/types/pieza';

export const obtenerPiezas = async () => {
  const { data } = await api.get('/piezas', { params: { limit: 100 } });
  return data.data;
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
