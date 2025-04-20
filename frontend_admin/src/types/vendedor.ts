import type { Usuario } from './usuario';

export interface Vendedor extends Usuario {
  rol: 'vendedor'; 
  ventasTotales?: number;
  clientesAtendidos?: number;
  fechaRegistro?: string;
}