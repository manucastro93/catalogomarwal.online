export interface LogCliente {
  id: number;
  categoriaId?: number | null;
  busqueda?: string | null;
  tiempoEnPantalla?: number | null;
  ubicacion?: string | null;
  sesion?: string | null;
  referer?: string | null;
  fuente?: string | null;
  ipClienteId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  ipCliente?: {
    ip: string;
    clientes?: { id: number; nombre: string }[];
  };
  categoria?: {
    id: number;
    nombre: string;
  };
}
