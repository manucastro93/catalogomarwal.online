export interface OrdenTrabajo {
  id: number;
  fecha: string; // ISO date (YYYY-MM-DD)
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  plantaId: number;
  nota?: string;
  productos: {
    productoId: number;
    cantidad: number;
    producto?: {
      id: number;
      nombre: string;
      sku: string;
      precioUnitario: number;
      costoMP?: number;
      costoDux?: number;
    }
  }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
  planta?: {
    id: number;
    nombre: string;
    direccion: string;
  };
}

export interface CrearOrdenTrabajo {
  fecha: string; // ISO date
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  plantaId: number;
  nota?: string;
  productos: {
    productoId: number;
    cantidad: number;
  }[];
}
