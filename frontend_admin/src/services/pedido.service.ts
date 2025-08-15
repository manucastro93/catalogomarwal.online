import api from './api';
import qs from "qs";
import type { Pedido, PedidoPayload, RespuestaPaginadaPedidos, PedidoDux } from '@/types/pedido';
import type { FiltrosPedidos } from 'types/filtro'; 
import type { ProductoPendiente } from "@/types/producto";

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

export const obtenerPedidosInicio = async (vendedorId?: number): Promise<{ pendientes: Pedido[]; confirmados: Pedido[] }> => {
  const { data } = await api.get('/pedidos/inicio', {
    params: vendedorId ? { vendedorId } : {},
  });
  console.log(data)
  return data;
};

export async function obtenerPedidoDuxPorId(id: number) {
  const res = await api.get<PedidoDux>(`/pedidos/pedido-dux/${id}`);
  return res.data;
}

/*export const enviarPedidoADux = async (id: number): Promise<{ message: string }> => {
  const { data } = await api.post(`/pedidos/${id}/enviar-a-dux`);
  return data;
};*/

export async function obtenerPedidosDux(params?: any) {
  const res = await api.get('/pedidos/dux', {
    params,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  });
  return res.data;
}

export async function obtenerDetallesPedidoDux(pedidoDuxId: number) {
  const res = await api.get(`/pedidos/dux/${pedidoDuxId}`);
  return res.data;
}

export async function obtenerProductosPedidosPendientes(params: {
  desde?: string;
  hasta?: string;
  categoriaId?: number;
}): Promise<ProductoPendiente[]> {
  const { data } = await api.get('/pedidos/productos-pendientes', {
    params,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
  });
  return data;
}

export async function obtenerPedidosPendientesPorProducto(
  codItem: string,
  params?: { desde?: string; hasta?: string }
) {
  const { data } = await api.get(`/pedidos/productos-pendientes/${codItem}`, {
    params,
    paramsSerializer: (p) => qs.stringify(p),
  });
  return data;
}

export const obtenerPedidoPorClienteYFecha = async (
  cliente: string,
  fecha: string
): Promise<PedidoDux | null> => {
  const { data } = await api.get('/pedidos/buscar-por-cliente-y-fecha', {
    params: { cliente, fecha },
  });
  return data;
};