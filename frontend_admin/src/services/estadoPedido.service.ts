import api from './api';
import type { EstadoPedido } from '../types/estadoPedido';

export const obtenerEstadosPedido = async (): Promise<EstadoPedido[]> => {
  const { data } = await api.get('/estados-pedidos');
  return data;
};

export const crearEstadoPedido = async (estado: Partial<EstadoPedido>): Promise<EstadoPedido> => {
  const { data } = await api.post('/estados-pedidos', estado);
  return data;
};

export const editarEstadoPedido = async (id: number, estado: Partial<EstadoPedido>): Promise<EstadoPedido> => {
  const { data } = await api.put(`/estados-pedidos/${id}`, estado);
  return data;
};

export const eliminarEstadoPedido = async (id: number): Promise<void> => {
  await api.delete(`/estados-pedidos/${id}`);
};
