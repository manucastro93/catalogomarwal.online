import api from './api';
import type { Pagina } from '@/types/pagina';
import type { Banner } from '@/types/banner';

export const obtenerPagina = async (): Promise<Pagina> => {
  const { data } = await api.get('/pagina');
  return data;
};

export const actualizarPagina = async (pagina: Partial<Pagina>) => {
  const { data } = await api.put('/pagina', pagina);
  return data;
};

export const crearBanner = async (formData: FormData) => {
  const { data } = await api.post('/pagina/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const subirLogo = async (file: File) => {
  const formData = new FormData();
  formData.append('logo', file);

  console.log('🔍 Subiendo logo a /pagina/logo');

  const { data } = await api.post('/pagina/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const eliminarBanner = async (id: number) => {
  const { data } = await api.delete(`/pagina/banners/${id}`);
  return data;
};

