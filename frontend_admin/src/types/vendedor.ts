import type { Usuario } from './usuario';

export interface Vendedor extends Usuario {
  rolUsuarioId: 3;  // Aquí se indica que el rol es Vendedor (usando el ID de la base de datos)
  ventasTotales?: number;
  clientesAtendidos?: number;
  fechaRegistro?: string;
}