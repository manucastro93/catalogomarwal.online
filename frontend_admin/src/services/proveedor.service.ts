import api from './api';
import type { Proveedor } from '@/types/proveedor';

export const obtenerProveedores = async (params: any) => {
  const { data } = await api.get('/proveedores', { params });
  return data;
};

export const crearProveedor = async (proveedor: Partial<Proveedor>) => {
  const response = await api.post('/proveedores', proveedor);
  return response.data;
};

export const editarProveedor = async (id: number, proveedor: Partial<Proveedor>) => {
  const response = await api.put(`/proveedores/${id}`, proveedor);
  return response.data;
};

export const buscarProveedoresPorTexto = async (texto: string): Promise<Proveedor[]> => {
  const { data } = await api.get('/proveedores', {
    params: { buscar: texto, limit: 10 },
  });
  return data.data || [];
};

export const obtenerHistorialProveedor = async (proveedorId: number) => {
  const { data } = await api.get(`/proveedores/${proveedorId}/historial`);
  return data;
};
