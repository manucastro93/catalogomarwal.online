import api from './api';
import type { Categoria } from '@/types/categoria';

export const obtenerCategorias = async () => {
  const { data } = await api.get('/categorias', {
    params: { limit: 100 } 
  });
  return data.data;
};


export const crearCategoria = async (categoria: Partial<Categoria>) => {
  const { data } = await api.post('/categorias', categoria);
  return data;
};

export const editarCategoria = async (id: number, categoria: Partial<Categoria>) => {
  const { data } = await api.put(`/categorias/${id}`, categoria);
  return data;
};

export const eliminarCategoria = async (id: number) => {
  const { data } = await api.delete(`/categorias/${id}`);
  return data;
};
