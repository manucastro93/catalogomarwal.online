import api from './api';
import type {
  ClienteDux,
  ClienteDuxPorMes,
  ClienteDuxPorDia,
  FiltrosClientesDux,
} from '@/types/clienteDux';

export const obtenerClientesDux = async (params: any): Promise<{
  data: ClienteDux[];
  total: number;
  pagina: number;
  totalPaginas: number;
}> => {
  const { data } = await api.get('/clientesDux', { params });
  return data;
};

export const obtenerInformeClientesDux = async (
  params: FiltrosClientesDux & { page?: number }
): Promise<{
  porMes: ClienteDuxPorMes[];
  porDia: ClienteDuxPorDia[];
  detalle: ClienteDux[];
  totalPaginas: number;
}> => {
  const { data } = await api.get('/clientesDux/informes', { params });
  return data;
};

export const obtenerListasPrecioClientesDux = async (): Promise<string[]> => {
  const { data } = await api.get('/clientesDux/listas-precio');
  return data;
};

export const obtenerReporteEjecutivoClientesDux = async (): Promise<string> => {
  const { data } = await api.get('/clientesDux/reporte-ejecutivo');
  return data.reporte;
};