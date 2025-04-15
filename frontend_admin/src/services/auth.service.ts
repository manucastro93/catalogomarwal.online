import api from './api';

export const loginUsuario = async (email: string, contraseña: string) => {
  const { data } = await api.post('/auth/login', { email, contraseña });
  return data;
};
