import api from './api';

export const loginUsuario = async (email: string, contraseña: string) => {
  console.log(api.defaults.baseURL);
  const { data } = await api.post('/auth/login', { email, contraseña });
  return data;
};
