import api from './api';
import type { Pedido, PedidoPayload, RespuestaPaginadaPedidos } from '../types/pedido';
import type { FiltrosPedidos } from 'types/filtro'; 

export const obtenerPedidos = async (
  params: FiltrosPedidos
): Promise<RespuestaPaginadaPedidos> => {
  const { data } = await api.get('/pedidos', { params });
  return data;
};

export const obtenerPedidoPorId = async (id: number): Promise<Pedido> => {
  const { data } = await api.get(`/pedidos/${id}`);
  return data;
};

export const actualizarEstadoPedido = async (
  id: number,
  estadoPedidoId: number
): Promise<{ message: string; estadoPedidoId: number }> => {
  const { data } = await api.put(`/pedidos/${id}/estado`, { estadoPedidoId });
  return data;
};

export const crearPedidoDesdePanel = async (
  payload: PedidoPayload
): Promise<Pedido> => {
  const { data } = await api.post('/pedidos/desde-panel', payload);
  return data;
};

export const obtenerPedidosInicio = async (
  vendedorId?: number
): Promise<{ pendientes: Pedido[]; confirmados: Pedido[] }> => {
  const { data } = await api.get('/pedidos/inicio', {
    params: vendedorId ? { vendedorId } : {},
  });
  return data;
};
