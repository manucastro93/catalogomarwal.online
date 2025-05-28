import api from './api';
import type { FiltrosConversacionBot, RespuestaConversaciones } from '@/types/conversacionBot';

export const obtenerConversacionesBot = async (
  filtros: FiltrosConversacionBot
): Promise<RespuestaConversaciones> => {
  const params = new URLSearchParams();

  if (filtros.page) params.append('page', filtros.page.toString());
  if (filtros.limit) params.append('limit', filtros.limit.toString());
  if (filtros.buscar) params.append('buscar', filtros.buscar);
  if (filtros.derivar !== undefined) params.append('derivar', filtros.derivar.toString());

  const { data } = await api.get<RespuestaConversaciones>(`/conversaciones-bot?${params.toString()}`);
  return data;
};

export const obtenerConversacionesAgrupadas = async (params: { buscar?: string }) => {
  const res = await api.get('/conversaciones-bot/agrupadas', { params });
  return res.data;
};