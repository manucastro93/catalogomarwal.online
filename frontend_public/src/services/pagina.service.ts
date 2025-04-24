import api from './api';
import type { Pagina } from '../types/pagina';

export const obtenerPagina = async (): Promise<Pagina> => {
  const res = await api.get('/pagina');
  return res.data;
};

export const obtenerBanners = async () => {
  const res = await api.get('/banners');
  return res.data;
};
