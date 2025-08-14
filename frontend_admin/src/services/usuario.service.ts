import api from './api';
import type { Usuario } from '@/types/usuario';

type Params = {
  q?: string;
  rolId?: string | number;
  sortBy?: "id" | "nombre" | "email" | "telefono" | "rol";
  sortDir?: "ASC" | "DESC";
  _r?: number; // para reactividad, ignorado por el back
};

export const obtenerUsuarios = async (p?: Params): Promise<Usuario[]> => {
  const qs = new URLSearchParams();
  if (p?.q) qs.set("q", p.q);
  if (p && p.rolId !== undefined && p.rolId !== null && String(p.rolId) !== "") {
    qs.set("rolId", String(p.rolId));
  }
  qs.set("sortBy", p?.sortBy || "id");
  qs.set("sortDir", p?.sortDir || "ASC");

  const url = qs.toString() ? `/usuarios?${qs.toString()}` : "/usuarios";
  const { data } = await api.get<Usuario[]>(url);
  return data;
};

export const obtenerUsuariosPorRol = async (rol: string): Promise<Usuario[]> => {
  try {
    const response = await api.get(`/usuarios/rol/${rol}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios', error);
    throw error;
  }
};

export const obtenerUsuariosPorRolPorId = async (rolUsuarioId: number): Promise<Usuario[]> => {
  try {
    const response = await api.get(`/usuarios/rol-id/${rolUsuarioId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios', error);
    throw error;
  }
};

export const obtenerUsuariosOperarios = async (): Promise<Usuario[]> => {
  try {
    const response = await api.get('/usuarios/operarios'); 
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios', error);
    throw error;
  }
};

export const crearUsuario = async (usuario: Partial<Usuario>): Promise<Usuario> => {
  const response = await api.post('/usuarios', { ...usuario });
  return response.data;
};


export const editarUsuario = async (id: number, usuario: Partial<Usuario>): Promise<Usuario> => {
  try {
    const response = await api.put(`/usuarios/${id}`, { ...usuario });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario', error);
    throw error;
  }
};


export const eliminarUsuario = async (id: number): Promise<void> => {
  try {
    await api.delete(`/usuarios/${id}?}`);
  } catch (error) {
    console.error('Error al eliminar usuario', error);
    throw error;
  }
};


export const cambiarContrasena = async (id: number, nuevaContrasena: string): Promise<void> => {
  await api.put(`/usuarios/${id}/cambiar-contrasena`, { contraseña: nuevaContrasena });
};

