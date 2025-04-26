export interface RolUsuario {
  id: number;
  nombre: 'Supremo' | 'Administrador' | 'Vendedor' | 'Operario';
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}
