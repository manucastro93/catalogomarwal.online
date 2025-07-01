import { MateriaPrima } from '@/types/materiaPrima';
import api from './api';

export const obtenerMateriasPrimas = async (params = {}) => {
  const { data } = await api.get('/materias-primas', { params });
  return data;
};

export const obtenerMateriaPrimaPorId = async (id: number): Promise<MateriaPrima> => {
  const { data } = await api.get(`/materias-primas/${id}`);
  return data;
};

export const actualizarMateriaPrima = async (id: number, materiaPrima: Partial<MateriaPrima>) => {
  const { data } = await api.put(`/materias-primas/${id}`, materiaPrima);
  return data;
};
