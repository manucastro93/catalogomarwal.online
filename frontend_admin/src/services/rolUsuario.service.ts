import api from './api';
import type { RolUsuario } from '@/types/rolUsuario';
import type { PermisoUsuario } from '@/types/permisoUsuario';

export const obtenerRolesUsuario = async (): Promise<RolUsuario[]> => {
  const { data } = await api.get('/roles-usuario');
  return data;
};

export const obtenerPermisosPorRol = async (rolId: number) => {
  if (rolId === -1) return [];
  const { data } = await api.get(`/roles-usuario/${rolId}/permisos`);
  return data;
};


export const actualizarPermisosRol = async (rolId: number, permisos: PermisoUsuario[]) => {
  const cambios = permisos.map(p => ({
    id: p.id,
    permitido: p.permitido
  }));

  await api.put(`/roles-usuario/${rolId}/permisos`, cambios);
};

export const crearRolUsuario = async (rol: Partial<RolUsuario>): Promise<RolUsuario> => {
  const { data } = await api.post('/roles-usuario', rol);
  return data;
};

export const editarRolUsuario = async (id: number, rol: Partial<RolUsuario>): Promise<RolUsuario> => {
  const { data } = await api.put(`/roles-usuario/${id}`, rol);
  return data;
};

export const eliminarRolUsuario = async (id: number): Promise<void> => {
  await api.delete(`/roles-usuario/${id}`);
};
