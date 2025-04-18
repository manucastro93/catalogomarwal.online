import api from './api';
import type { Producto } from '../shared/types/producto';

export const obtenerProductos = async (params = {}) => {
  const { data } = await api.get('/productos', { params });
  return data;
};

export const obtenerProductoPorId = async (id: number): Promise<Producto> => {
  const { data } = await api.get(`/productos/${id}`);
  return data;
};

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
