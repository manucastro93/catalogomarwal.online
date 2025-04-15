import api from './api';

export const obtenerResumenDelMes = async () => {
  const { data } = await api.get('/estadisticas/resumen');
  return data;
};
