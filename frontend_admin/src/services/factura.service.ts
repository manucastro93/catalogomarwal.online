import api from './api';
import type { FacturaDux, EstadoFactura, DetalleFacturaDux } from '@/types/factura';

export interface RespuestaPaginadaFacturas {
  data: FacturaDux[];
  pagina: number;
  totalPaginas: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export async function obtenerFacturas(params?: any): Promise<RespuestaPaginadaFacturas> {
  const res = await api.get<RespuestaPaginadaFacturas>('/facturas', { params });
    console.log(res.data)

  return res.data;
}

export async function obtenerEstadosFactura(): Promise<EstadoFactura[]> {
  const res = await api.get<EstadoFactura[]>('/facturas/estados-factura');
  return res.data;
}

export async function obtenerDetalleFacturaDux(id: number): Promise<DetalleFacturaDux[]> {
  const res = await api.get<DetalleFacturaDux[]>(`/facturas/${id}/detalles`);
  return res.data;
}
