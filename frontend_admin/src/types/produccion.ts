// Detalle de reporte (cada producto reportado)
export interface ReporteProduccion {
  id: number;
  reporteProduccionEncabezadoId?: number; // FK al encabezado (puede estar en null si migraste)
  productoId: number;
  cantidad: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Info del producto (puede venir anidada si hacés include)
  producto?: {
    id: number;
    nombre: string;
    sku: string;
    precioUnitario: number;
    costoMP?: number;
    costoDux?: number;
  };
}

// Encabezado (el reporte principal)
export interface ReporteProduccionEncabezado {
  id: number;
  fecha: string;
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  plantaId: number;
  nota?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Info del usuario que lo creó (puede venir anidada si hacés include)
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
  productos: ReporteProduccion[]; // Array de detalles
}

// Para crear un reporte completo (encabezado + productos)
export interface CrearReporteProduccionEncabezado {
  fecha: string;
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  plantaId: number;
  nota?: string;
  productos: {
    productoId: number;
    cantidad: number;
  }[];
  ordenTrabajoId?: number;
}

// Por compatibilidad: el antiguo (ya no se usa para crear, pero puede quedar en código viejo)
export interface CrearReporteProduccion {
  productoId: number;
  cantidad?: number;
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  plantaId: number;
}

// Para filtrar/listar
export interface ProduccionParams {
  page?: number;
  limit?: number;
  orden?: string;
  direccion?: "asc" | "desc";
  desde?: string;       // formato ISO: "2025-04-01"
  hasta?: string;       // formato ISO: "2025-04-30"
  turno?: "mañana" | "tarde" | "noche";
  plantaId?: number;
}
