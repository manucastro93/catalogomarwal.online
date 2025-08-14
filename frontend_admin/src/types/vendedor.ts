import type { Usuario } from "./usuario";

export interface Vendedor extends Usuario {
  rolUsuarioId: 3;
  ventasTotales?: number;
  clientesAtendidos?: number;
  fechaRegistro?: string;
}
