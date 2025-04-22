import type { Vendedor } from './vendedor';
export interface PedidoClienteInput {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  razonSocial?: string;
  cuit_cuil?: string;
  provinciaId?: number;
  localidadId?: number;
  vendedorId?: number; 
}

export interface ItemCarritoInput {
  id: number; 
  nombre: string;
  cantidad: number; 
  precio: number;   
  precioPorBulto?: number;
  unidadPorBulto?: number;
  usuarioId: number | null;
}

export interface PedidoPayload {
  cliente: PedidoClienteInput;
  carrito: ItemCarritoInput[];
  usuarioId?: number | null;
  vendedor?: Vendedor;
  pedidoId?: number | null;
}

export interface Pedido {
  id: number;
  estado: string;
  estadoEdicion?: string;
  total: number;
  detalles: any[];
  cliente: any;
  usuario?: any;
  createdAt: string;
  updatedAt: string;
}