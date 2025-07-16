import api from './api';
import type { ConfiguracionSistema } from '@/types/configuracionSistema';

export const obtenerConfiguraciones = async (): Promise<ConfiguracionSistema[]> => {
  const { data } = await api.get('/configuraciones');
  return data;
};

export const obtenerConfiguracionPorClave = async (clave: string): Promise<ConfiguracionSistema> => {
  const { data } = await api.get(`/configuraciones/clave/${clave}`);
  return data;
};

export const crearConfiguracion = async (config: Partial<ConfiguracionSistema>): Promise<ConfiguracionSistema> => {
  const { data } = await api.post('/configuraciones', config);
  return data;
};

export const editarConfiguracion = async (id: number, config: Partial<ConfiguracionSistema>): Promise<ConfiguracionSistema> => {
  const { data } = await api.put(`/configuraciones/${id}`, config);
  return data;
};

export const eliminarConfiguracion = async (id: number): Promise<void> => {
  await api.delete(`/configuraciones/${id}`);
};
