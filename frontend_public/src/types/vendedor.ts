export interface Vendedor {
  id: number;
  nombre: string;
  email: string;
  contraseña?: string;
  rolUsuarioId: number;
  link?: string;
  telefono: string;
  createdAt: string;
  updatedAt: string;
}
