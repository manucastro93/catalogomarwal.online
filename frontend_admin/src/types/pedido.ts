import type { Cliente } from './cliente.js';
import type { Usuario } from './usuario.js';
import type { DetallePedido } from './detallePedido.js';
import type { EstadoPedido } from './estadoPedido.js';

export interface Pedido {
  id: number;
  estadoPedidoId: number;
  estadoPedido?: EstadoPedido;
  estadoEdicion: boolean;
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
    id: number;
    cantidad: number;
    precio: number;
    unidadPorBulto: number;
  }[];
  usuarioId?: number | null;
}

export interface RespuestaPaginadaPedidos {
  data: Pedido[];
  pagina: number;
  totalPaginas: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
