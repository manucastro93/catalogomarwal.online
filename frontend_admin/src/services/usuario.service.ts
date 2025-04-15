import api from './api';
import type { Usuario } from '../shared/types/usuario';

export const obtenerUsuarios = async (): Promise<Usuario[]> => {
  const { data } = await api.get('/usuarios');
  return data;
};

export const crearUsuario = async (usuario: Partial<Usuario>) => {
  const { data } = await api.post('/usuarios', usuario);
  return data;
};

export const actualizarUsuario = async (id: number, usuario: Partial<Usuario>) => {
  const { data } = await api.put(`/usuarios/${id}`, usuario);
  return data;
};

export const eliminarUsuario = async (id: number) => {
  await api.delete(`/usuarios/${id}`);
};

