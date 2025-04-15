import type { Producto } from './producto';

export interface DetallePedido {
  id: number;
  pedidoId: number;
  productoId: number;
  clienteId?: number;
  usuarioId?: number;
  cantidad: number;
  precioUnitario: number;
  precioXBulto?: number;
  subtotal?: number;
  descuento?: number;
  observaciones?: string;
  dispositivo?: string;
  createdAt: string;
  updatedAt: string;
  Producto?: Producto; 
}
