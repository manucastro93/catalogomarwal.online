import api from './api';
import type { Rubro } from '@/types/rubro';

export const obtenerRubros = async () => {
  const { data } = await api.get('/rubros', { params: { limit: 100 } });
  return data.data;
};

export const crearRubro = async (rubro: Partial<Rubro>) => {
  const { data } = await api.post('/rubros', rubro);
  return data;
};

export const editarRubro = async (id: number, rubro: Partial<Rubro>) => {
  const { data } = await api.put(`/rubros/${id}`, rubro);
  return data;
};

export const eliminarRubro = async (id: number) => {
  const { data } = await api.delete(`/rubros/${id}`);
  return data;
};
