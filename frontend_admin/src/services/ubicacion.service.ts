import api from './api';

export const obtenerProvincias = async () => {
  const { data } = await api.get('/public/provincias');
  return data;
};

export const obtenerLocalidades = async (provinciaId: number) => {
  if (!provinciaId || isNaN(provinciaId)) return [];
  const { data } = await api.get(`/public/provincia/${provinciaId}/localidades`);
  return data;
};