import type { Vendedor } from './vendedor';
import type { Cliente } from './cliente';
import type { DetallePedido } from './detallePedido';

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
  precioUnitario: number;
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
  estadoPedidoId: number;
  estadoPedido?: { id: number; nombre: string };
  estadoEdicion: boolean;
  total: number;
  detalles: DetallePedido[];
  cliente: Cliente;
  usuario?: Vendedor;
  createdAt: string;
  updatedAt: string;
}
