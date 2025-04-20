import api from './api';

export const obtenerResumenDelMes = async () => {
  const { data } = await api.get('/estadisticas/resumen');
  return data;
};

export const obtenerEstadisticasPorFecha = async (desde: string, hasta: string) => {
  const { data } = await api.get('/estadisticas/por-fecha', {
    params: { desde, hasta }
  });
  return data;
};

export const compararRangos = async (
  desde1: string,
  hasta1: string,
  desde2: string,
  hasta2: string
) => {
  const { data } = await api.get('/estadisticas/comparar-rangos', {
    params: { desde1, hasta1, desde2, hasta2 },
  });
  return data;
};

export const obtenerRankingEstadisticas = async (desde: string, hasta: string) => {
  const { data } = await api.get('/estadisticas/ranking', {
    params: { desde, hasta },
  });
  return data;
};

export const obtenerEstadisticasProducto = async (productoId: number) => {
  const { data } = await api.get(`/estadisticas/producto/${productoId}`);
  return data;
};
