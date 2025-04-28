import api from './api';
import type { Usuario } from '@/types/usuario';

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

export const obtenerUsuarios = async (): Promise<Usuario[]> => {
  try {
    const response = await api.get('/usuarios'); 
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios', error);
    throw error;
  }
};

export const crearUsuario = async (usuario: Partial<Usuario>, modulo: string): Promise<Usuario> => {
  const response = await api.post('/usuarios', { ...usuario, modulo });
  return response.data;
};


export const editarUsuario = async (id: number, usuario: Partial<Usuario>, modulo: string): Promise<Usuario> => {
  try {
    const response = await api.put(`/usuarios/${id}`, { ...usuario, modulo });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario', error);
    throw error;
  }
};


export const eliminarUsuario = async (id: number, modulo: string): Promise<void> => {
  try {
    await api.delete(`/usuarios/${id}?modulo=${encodeURIComponent(modulo)}`);
  } catch (error) {
    console.error('Error al eliminar usuario', error);
    throw error;
  }
};


export const cambiarContrasena = async (id: number, nuevaContrasena: string): Promise<void> => {
  await api.put(`/usuarios/${id}/cambiar-contrasena`, { contraseña: nuevaContrasena });
};

