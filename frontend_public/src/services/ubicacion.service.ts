import api from './api';

export const obtenerProvincias = async () => {
  const res = await api.get('/provincias');
  return res.data;
};

export const obtenerLocalidades = async (provinciaId: number) => {
  if (!provinciaId) return [];
  const res = await api.get(`/provincia/${provinciaId}/localidades`);
  return res.data;
};

export const buscarLocalidades = async (texto: string, provinciaId: number) => {
  if (!texto || !provinciaId) return [];
  const res = await api.get('/localidades', {
    params: {
      q: texto,
      provinciaId,
    },
  });
  return res.data;
};
