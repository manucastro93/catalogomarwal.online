import api from './api';
import type { LogCliente } from '@/types/log';

export const obtenerLogsCliente = async (clienteId: number): Promise<LogCliente[]> => {
  const { data } = await api.get('/logs-cliente', { params: { clienteId } });
  return data.data;
};

export const obtenerLogsGenerales = async (params: any) => {
  const { data } = await api.get('/logs-cliente', { params });
  return data;
};
