import api from './api';
import type { Pedido } from '../shared/types/pedido';

export const obtenerPedidos = async (params: {
  pagina?: number;
  orden?: string;
  direccion?: string;
  busqueda?: string;
}): Promise<{
  data: Pedido[];
  total: number;
  pagina: number;
  totalPaginas: number;
}> => {
  const { data } = await api.get('/pedidos', { params });
  return data;
};

export const obtenerPedidoPorId = async (id: number): Promise<Pedido> => {
  const { data } = await api.get(`/pedidos/${id}`);
  return data;
};

export const actualizarEstadoPedido = async (id: number, estado: string) => {
  const { data } = await api.put(`/pedidos/${id}/estado`, { estado });
  return data;
};

export const eliminarPedido = async (id: number) => {
  await api.delete(`/pedidos/${id}`);
};
