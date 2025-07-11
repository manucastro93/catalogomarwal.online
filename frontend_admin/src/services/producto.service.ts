import api from './api';
import type { Producto } from '@/types/producto';

export const obtenerProductos = async (params = {}) => {
  const { data } = await api.get('/productos', { params });
  return data;
};

export const obtenerProductosProveedores = async (params = {}) => {
  const { data } = await api.get('/productos/proveedores', { params });
  return data;
};

export const obtenerProductoPorId = async (id: number): Promise<Producto> => {
  const { data } = await api.get(`/productos/${id}`);
  return data;
};

export const buscarProductosPorTexto = async (texto: string): Promise<Producto[]> => {
  const { data } = await api.get('/productos/produccion', {
    params: { buscar: texto, limit: 20 },
  });
  return data.data || [];
};

/*export async function buscarProductosPorTexto(texto: string, listaPrecioId?: string) {
  const params: any = { texto };
  if (listaPrecioId) params.listaPrecioId = listaPrecioId;
  const res = await api.get('/productos', { params });
  return res.data;
}*/


export const crearProducto = async (producto: Partial<Producto>) => {
  const { data } = await api.post('/productos', producto);
  return data;
};

export const crearProductoConImagenes = async (formData: FormData) => {
  const { data } = await api.post('/productos/con-imagenes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const actualizarProducto = async (id: number, producto: Partial<Producto>) => {
  const { data } = await api.put(`/productos/${id}`, producto);
  return data;
};

export const actualizarProductoConImagenes = async (id: number, formData: FormData) => {
  const { data } = await api.put(`/productos/${id}/con-imagenes`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const eliminarProducto = async (id: number) => {
  await api.delete(`/productos/${id}`);
};

export const eliminarImagenProducto = async (id: number) => {
  const { data } = await api.delete(`/productos/imagenes/${id}`);
  return data;
};

export const importarProductosDesdeExcel = async (formData: FormData) => {
  const { data } = await api.post('/productos/importar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const actualizarOrdenImagenes = async (imagenes: { id: number; orden: number }[]) => {
  const { data } = await api.put('/productos/imagenes/ordenar', { imagenes });
  return data;
};

export const sincronizarProductosDesdeDux = async (): Promise<string> => {
  const { data } = await api.post('/dux/sincronizar-dux');
  return data.mensaje || 'Sincronización finalizada';
};

export const obtenerProgresoSync = async (): Promise<{ porcentaje: number }> => {
  const { data } = await api.get('/dux/progreso-sync');
  return data;
};
