import type { Cliente } from './cliente.js';
import type { Usuario } from './usuario.js';
import type { EstadoPedido } from './estadoPedido.js';
import type { Producto } from './producto';

export interface PedidoLocal {
  tipo?: 'local';
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

export interface PedidoDuxItem {
  cod_item: string;
  item: string;
  ctd: string;
  precio_uni: string;
  [key: string]: any;
}

export interface PedidoDux {
  tipo: 'dux';
  id: number;
  nro_pedido: number;
  cliente: string;
  personal: string;
  fecha: string;
  total: string;
  estado_facturacion: string;
  observaciones: string;
  detalles: PedidoDuxItem[];

  nombre_vendedor?: string;
  apellido_vendedor?: string;
}

export type Pedido = PedidoLocal | PedidoDux;

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

export interface DetallePedido {
  id: number;
  pedidoId: number;
  productoId: number;
  clienteId?: number;
  usuarioId?: number;
  cantidad: number;
  precioUnitario: number;
  unidadPorBulto?: number;
  precioPorBulto?: number;
  subtotal?: number;
  descuento?: number;
  observaciones?: string;
  dispositivo?: string;
  createdAt: string;
  updatedAt: string;
  producto?: Producto; 
}
