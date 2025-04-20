import type { Cliente } from './cliente.js';
import type { Usuario } from './usuario.js';
import type { DetallePedido } from './detallePedido.js';

export type EstadoPedido =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "rechazado";

export interface Pedido {
  id: number;
  estado: EstadoPedido;
  observaciones?: string | null;
  total: number;
  clienteId: number;
  usuarioId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  cliente?: Cliente;
  usuario?: Usuario;
  detalles?: DetallePedido[];

  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  vendedorNombre?: string;
}

export interface PedidoPayload {
  cliente: Cliente;
  carrito: {
    id: number; // id del producto
    cantidad: number;
    precio: number; // precio por bulto
    unidadPorBulto: number;
  }[];
  usuarioId?: number | null;
}