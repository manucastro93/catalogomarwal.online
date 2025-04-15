import type { Cliente } from './cliente.js';
import type { Usuario } from './usuario.js';
import type { DetallePedido } from './detallePedido.js';

export interface Pedido {
  id: number;
  estado: 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado' | 'rechazado';
  observaciones?: string;
  total: number;
  clienteId: number;
  usuarioId?: number;
  Cliente?: Cliente; 
  Usuario?: Usuario; 
  detalles?: DetallePedido[];
  createdAt: string;
  updatedAt: string;
}
