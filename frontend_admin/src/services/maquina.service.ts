import api from './api';
import type { Maquina } from '@/types/maquina';

export const obtenerMaquinas = async () => {
  const { data } = await api.get('/maquinas', { params: { limit: 100 } });
  return data.data;
};

export const buscarMaquinasPorTexto = async (texto: string) => {
  if (!texto) return [];
  const { data } = await api.get('/maquinas', { params: { search: texto, limit: 100 } });
  return data.data; // Ajustá según la estructura de tu backend
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
