import api from './api';

export const obtenerResumenDelMes = async () => {
  const { data } = await api.get('/estadisticas/resumen');
  console.log(data)
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

export type FilaVentasProducto = {
  productoId: number;
  codigo: string;
  descripcion: string;
  cant_mes_actual: number;
  monto_mes_actual: number;
  cant_mes_anterior: number;
  monto_mes_anterior: number;
  cant_3m: number;
  monto_3m: number;
  cant_12m: number;
  monto_12m: number;
};

export type RespuestaVentasProducto = {
  data: FilaVentasProducto[];
  pagina: number;
  totalPaginas: number;
};

export type ResumenVentasProducto = {
  top12m: FilaVentasProducto[];
  crecimientoUltimoMes: Array<FilaVentasProducto & { variacion_mes: number }>;
  enAlza: Array<FilaVentasProducto & { delta_vs_prom3m: number; estado: "sube" | "estable" | "baja" }>;
  enBaja: Array<FilaVentasProducto & { delta_vs_prom3m: number; estado: "sube" | "estable" | "baja" }>;
  proyeccion30d: { codigo: string; descripcion: string; monto_proyectado_30d: number; cant_proyectada_30d: number }[];
  oportunidades: { codigo: string; descripcion: string; monto_12m: number }[];
  texto?: string;
};

/**
 * Lista agregada de ventas por producto con filtros y paginación.
 * GET /estadisticas/ventas-producto
 */
export const listarVentasPorProducto = async (params: {
  q?: string;
  categoriaId?: number;
  vendedor?: string;          // "Apellido, Nombre" (igual que en otros endpoints)
  personalDuxId?: number;     // alternativa directa por ID
  page?: number;
  limit?: number;
  orderBy?: string;           // ej: "monto_12m", "codigo", etc.
  orderDir?: "ASC" | "DESC";  // default "DESC"
}) => {
  const { data } = await api.get<RespuestaVentasProducto>('/estadisticas/ventas-producto', {
    params,
  });
  return data;
};

/**
 * Resumen ejecutivo (top, tendencias, proyección).
 * GET /estadisticas/ventas-producto/resumen
 */
export const obtenerVentasPorProductoResumen = async (params?: {
  q?: string;
  categoriaId?: number;
  vendedor?: string;
  personalDuxId?: number;
}) => {
  const { data } = await api.get<ResumenVentasProducto>('/estadisticas/ventas-producto/resumen', {
    params,
  });
  return data;
};