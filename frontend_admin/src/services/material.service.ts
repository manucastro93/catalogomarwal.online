import api from './api';
import type { Material } from '@/types/material';

export const obtenerMateriales = async () => {
  const { data } = await api.get('/materiales', { params: { limit: 100 } });
  return data.data;
};

export const crearMaterial = async (material: Partial<Material>) => {
  const { data } = await api.post('/materiales', material);
  return data;
};

export const editarMaterial = async (id: number, material: Partial<Material>) => {
  const { data } = await api.put(`/materiales/${id}`, material);
  return data;
};

export const eliminarMaterial = async (id: number) => {
  const { data } = await api.delete(`/materiales/${id}`);
  return data;
};
