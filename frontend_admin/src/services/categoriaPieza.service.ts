import api from './api';
import type { CategoriaPieza } from '@/types/categoriaPieza';

export const obtenerCategoriasPiezas = async () => {
  const { data } = await api.get('/categorias-piezas', { params: { limit: 100 } });
  return data.data;
};

export const crearCategoriaPieza = async (categoria: Partial<CategoriaPieza>) => {
  const { data } = await api.post('/categorias-piezas', categoria);
  return data;
};

export const editarCategoriaPieza = async (id: number, categoria: Partial<CategoriaPieza>) => {
  const { data } = await api.put(`/categorias-piezas/${id}`, categoria);
  return data;
};

export const eliminarCategoriaPieza = async (id: number) => {
  const { data } = await api.delete(`/categorias-piezas/${id}`);
  return data;
};
