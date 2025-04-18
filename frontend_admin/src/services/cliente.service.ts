import api from './api';
import type { Cliente } from '../shared/types/cliente';

export const obtenerClientes = async (params: any) => {
  const { data } = await api.get('/clientes', { params });
  return data;
};

export const eliminarCliente = async (id: number) => {
  const { data } = await api.delete(`/clientes/${id}`);
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
  const { data } = await api.get('/clientes/mapa', { params });
  return data;
};