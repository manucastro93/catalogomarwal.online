export type RolUsuario = 'supremo' | 'administrador' | 'vendedor';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: RolUsuario;
  contraseña?: string | null;
  link?: string | null; // solo para vendedores
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
