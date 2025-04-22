import api from './api';
import type { Pedido, PedidoPayload } from '../types/pedido';

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

export const actualizarEstadoPedido = async (
  id: number,
  estado: string
): Promise<{ message: string; estado: string }> => {
  const { data } = await api.put(`/pedidos/${id}/estado`, { estado });
  return data;
};

export const eliminarPedido = async (id: number): Promise<void> => {
  await api.delete(`/pedidos/${id}`);
};

export const crearPedidoDesdePanel = async (
  payload: PedidoPayload
): Promise<Pedido> => {
  const { data } = await api.post('/pedidos/desde-panel', payload);
  return data;
};

export const marcarComoEditando = async (id: number): Promise<void> => {
  await api.put(`/pedidos/${id}/editando`);
};

export const revertirEditando = async (id: number): Promise<void> => {
  await api.put(`/pedidos/${id}/revertir-editando`);
};

export const obtenerPedidosInicio = async (
  vendedorId?: number
): Promise<{ pendientes: Pedido[]; confirmados: Pedido[] }> => {
  const { data } = await api.get('/pedidos/inicio', {
    params: vendedorId ? { vendedorId } : {},
  });
  return data;
};
