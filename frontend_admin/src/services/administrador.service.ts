import api from './api';
import type { Usuario } from '../types/usuario';

export const obtenerAdministradores = async (): Promise<Usuario[]> => {
  try {
    const response = await api.get('/usuarios/administradores');
    return response.data.filter((u: Usuario) => u.rol === 'administrador');
  } catch (error) {
    console.error('Error al obtener administradores', error);
    throw error;
  }
};

export const agregarAdministrador = async (admin: Partial<Usuario>): Promise<Usuario> => {
  try {
    const response = await api.post('/usuarios/administradores', admin);
    return response.data;
  } catch (error) {
    console.error('Error al agregar administrador', error);
    throw error;
  }
};

export const editarAdministrador = async (id: string | number, admin: Partial<Usuario>): Promise<Usuario> => {
  try {
    const response = await api.put(`/usuarios/administradores/${id}`, admin);
    return response.data;
  } catch (error) {
    console.error('Error al editar administrador', error);
    throw error;
  }
};

export const eliminarAdministrador = async (id: string | number): Promise<void> => {
  try {
    await api.delete(`/usuarios/administradores/${id}`);
  } catch (error) {
    console.error('Error al eliminar administrador', error);
    throw error;
  }
};
