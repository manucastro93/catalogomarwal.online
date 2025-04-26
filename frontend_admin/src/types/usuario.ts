import type { PermisoUsuario } from './permisoUsuario';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rolUsuarioId: number;
  contraseña?: string | null;
  link?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  permisos?: PermisoUsuario[];
}
