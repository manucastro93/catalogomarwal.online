import axios from 'axios';
import type { Pagina } from '../shared/types/pagina';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export async function obtenerPagina(): Promise<Pagina> {
  const res = await axios.get(`${API_URL}/pagina`);
  return res.data;
}

export const obtenerBanners = async () => {
  const res = await axios.get(`${API_URL}/pagina/banners`);
  return res.data;
};
