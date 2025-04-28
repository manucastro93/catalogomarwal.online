import api from './api';
import type { Notificacion } from '@/types/notificacion';

export const obtenerNotificaciones = async (): Promise<Notificacion[]> => {
  const { data } = await api.get('/notificaciones');
  return data;
};

export const marcarNotificacionComoLeida = async (id: number): Promise<void> => {
  await api.put(`/notificaciones/${id}/leida`);
};
