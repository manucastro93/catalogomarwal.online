import api from './api';
import type { ComposicionProductoMateriaPrima } from '@/types/composicion';

// Listar composiciones por producto
export const obtenerComposicionesPorProducto = async (productoId: number) => {
  const { data } = await api.get<ComposicionProductoMateriaPrima[]>(`/composiciones/producto/${productoId}`);
  return data;
};

// Crear composición
export const crearComposicion = async (comp: Omit<ComposicionProductoMateriaPrima, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'MateriaPrima'>) => {
  const { data } = await api.post<ComposicionProductoMateriaPrima>('/composiciones', comp);
  return data;
};

// Editar composición
export const editarComposicion = async (id: number, cambios: Partial<ComposicionProductoMateriaPrima>) => {
  const { data } = await api.put<ComposicionProductoMateriaPrima>(`/composiciones/${id}`, cambios);
  return data;
};

// Eliminar composición
export const eliminarComposicion = async (id: number) => {
  const { data } = await api.delete(`/composiciones/${id}`);
  return data;
};

// POST /productos/:id/composicion
export const guardarComposicionProducto = async (
  productoId: number,
  data: {
    composicion: { materiaPrimaId: number; cantidad: number; unidadMedida: string }[];
    tiempoProduccionSegundos: number;
  }
) => {
  return api.post(`/composiciones/${productoId}/composicion`, data);
};


