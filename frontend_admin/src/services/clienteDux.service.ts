import api from './api';
import type { ClienteDux } from '@/types/clienteDux';

export const obtenerClientesDux = async (params: any) => {
  const { data } = await api.get('/clientesDux', { params });
  return data;
};