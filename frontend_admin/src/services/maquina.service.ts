import api from './api';
import type { Maquina } from '@/types/maquina';

export const obtenerMaquinas = async () => {
  const { data } = await api.get('/maquinas', { params: { limit: 100 } });
  return data.data;
};

export const crearMaquina = async (maquina: Partial<Maquina>) => {
  const { data } = await api.post('/maquinas', maquina);
  return data;
};

export const editarMaquina = async (id: number, maquina: Partial<Maquina>) => {
  const { data } = await api.put(`/maquinas/${id}`, maquina);
  return data;
};

export const eliminarMaquina = async (id: number) => {
  const { data } = await api.delete(`/maquinas/${id}`);
  return data;
};
