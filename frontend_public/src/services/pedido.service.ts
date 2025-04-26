import api from './api';
import type { Pedido, PedidoPayload } from '@/types/pedido';
import { ESTADOS_PEDIDO } from '../constants/estadosPedidos';

export const obtenerMisPedidos = async (): Promise<Pedido[]> => {
  const res = await api.get('/pedidos/id-cliente');
  return res.data;
};

export const obtenerPedidoPorId = async (
  id: number
): Promise<Pedido> => {
  const res = await api.get(`/pedidos/${id}`);
  return res.data;
};

export const enviarPedido = async (
  data: PedidoPayload
): Promise<{ pedidoId: number; clienteId: number }> => {
  const res = await api.post('/pedidos', data);
  const json = res.data;

  if (!json?.pedidoId || !json?.clienteId) {
    throw {
      status: res.status,
      mensaje: json?.mensaje || "Error al enviar el pedido",
      errores: json?.errores || [],
      carritoActualizado: json?.carritoActualizado || [],
    };
  }

  return json;
};

export const duplicarPedido = async (
  pedidoId: number
): Promise<{ message: string; pedidoId: number; clienteId: number }> => {
  const res = await api.post('/pedidos/duplicar', { pedidoId });
  return res.data;
};

export const marcarComoEditando = async (id: number): Promise<void> => {
  await api.put(`/pedidos/${id}/editando`);
};

export const revertirEditando = async (id: number): Promise<void> => {
  await api.put(`/pedidos/${id}/revertir-editando`);
};

export const cancelarPedidoDesdeCliente = async (
  id: number
): Promise<{ message: string }> => {
  const res = await api.put(`/pedidos/${id}/cancelar-desde-cliente`);
  return res.data;
};

export const validarCarrito = async (
  carrito: any[]
): Promise<{ detalles: any[]; total: number }> => {
  const res = await api.post('/pedidos/validar', { carrito });
  return res.data;
};
