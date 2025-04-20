import type { Usuario } from './usuario';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: string;
  usuarioId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  pedidoId?: number;
  usuario?: Usuario;
}
