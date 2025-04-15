// src/services/administrador.service.ts
import api from './api';
import type { Usuario } from '../shared/types/usuario';

// Obtener todos los administradores
export const obtenerAdministradores = async (): Promise<Usuario[]> => {
  try {
    const response = await api.get('/usuarios/administradores');
    return response.data.filter((u: Usuario) => u.rol === 'administrador');
  } catch (error) {
    console.error('Error al obtener administradores', error);
    throw error;
  }
};

// Agregar un nuevo administrador
export const agregarAdministrador = async (admin: Partial<Usuario>): Promise<Usuario> => {
  try {
    const response = await api.post('/usuarios/administradores', admin);
    return response.data;
  } catch (error) {
    console.error('Error al agregar administrador', error);
    throw error;
  }
};

// Editar un administrador
export const editarAdministrador = async (id: string | number, admin: Partial<Usuario>): Promise<Usuario> => {
  try {
    const response = await api.put(`/usuarios/administradores/${id}`, admin);
    return response.data;
  } catch (error) {
    console.error('Error al editar administrador', error);
    throw error;
  }
};

// Eliminar un administrador
export const eliminarAdministrador = async (id: string | number): Promise<void> => {
  try {
    await api.delete(`/usuarios/administradores/${id}`);
  } catch (error) {
    console.error('Error al eliminar administrador', error);
    throw error;
  }
};
