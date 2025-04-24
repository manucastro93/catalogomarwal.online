import api from './api';
import type { Cliente } from '../types/cliente';
import type { Producto } from '../types/producto';

export const obtenerClientes = async (params: any) => {
  const { data } = await api.get('/clientes', { params });
  return data;
};

export const crearCliente = async (cliente: Partial<Cliente>) => {
  const response = await api.post('/clientes', cliente);
  return response.data;
};

export const editarCliente = async (id: number, cliente: Partial<Cliente>) => {
  const response = await api.put(`/clientes/${id}`, cliente);
  return response.data;
};

export const obtenerClientesConVentas = async (vendedorId?: number): Promise<Cliente[]> => {
  const params = vendedorId ? { vendedorId } : {};
  const { data } = await api.get('/clientes/con-ventas', { params });
  return data;
};

export const buscarClientesPorTexto = async (texto: string): Promise<Cliente[]> => {
  const { data } = await api.get('/clientes', {
    params: { buscar: texto, limit: 10 },
  });
  return data.data || [];
};

export const obtenerHistorialCliente = async (clienteId: number) => {
  const { data } = await api.get(`/clientes/${clienteId}/historial`);
  return data;
};