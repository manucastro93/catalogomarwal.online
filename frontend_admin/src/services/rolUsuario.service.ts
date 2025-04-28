import api from './api';
import type { RolUsuario } from '@/types/rolUsuario';

export const obtenerRolesUsuario = async (): Promise<RolUsuario[]> => {
  const { data } = await api.get('/rol-usuario');
  return data;
};

export const crearRolUsuario = async (rol: Partial<RolUsuario>): Promise<RolUsuario> => {
  const { data } = await api.post('/rol-usuario', rol);
  return data;
};

export const editarRolUsuario = async (id: number, rol: Partial<RolUsuario>): Promise<RolUsuario> => {
  const { data } = await api.put(`/rol-usuario/${id}`, rol);
  return data;
};

export const eliminarRolUsuario = async (id: number): Promise<void> => {
  await api.delete(`/rol-usuario/${id}`);
};
