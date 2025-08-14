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

export const obtenerEstadisticasCliente = async (clienteId: number) => {
  const { data } = await api.get(`/clientes/${clienteId}/estadisticas`);
  return data;
};

export const obtenerEstadisticasVendedor = async (vendedorId: number) => {
  const { data } = await api.get(`/usuarios/${vendedorId}/estadisticas-vendedor`);
  return data;
};

export const obtenerVentasPorCategoria = async () => {
  const { data } = await api.get('/estadisticas/ventas-por-categoria');
  return data;
};

export const obtenerPedidosPorMesConVendedor = async (
  desde: string,
  hasta: string,
  vendedor?: string
) => {
  const { data } = await api.get('/estadisticas/pedidos-por-mes', {
    params: { desde, hasta, vendedor },
  });
  return data as { mes: string; totalPedidos: number; pedidosVendedor: number }[];
};
