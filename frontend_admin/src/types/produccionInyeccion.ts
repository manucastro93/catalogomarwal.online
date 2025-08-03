export interface ReporteProduccionInyeccionDetalle {
  id: number;
  reporteProduccionInyeccionEncabezadoId: number;
  operarioId: number;
  maquinaId: number;
  piezaId: number;
  horaDesde: string; // formato "HH:mm:ss"
  horaHasta: string; // formato "HH:mm:ss"
  cantidad: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Anidados si hacés include
  Operario?: {
    id: number;
    nombre: string;
    // Otros campos relevantes...
  };
  Maquina?: {
    id: number;
    nombre: string;
    // Otros campos...
  };
  Pieza?: import("@/types/pieza").Pieza;
}
export interface ReporteProduccionInyeccionEncabezado {
  id: number;
  fecha: string; // formato ISO
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  nota?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  Usuario?: {
    id: number;
    nombre: string;
    email: string;
  };

  // Array de detalles
  Detalles: ReporteProduccionInyeccionDetalle[];
}
export interface CrearReporteProduccionInyeccionEncabezado {
  fecha: string; // ISO string
  turno: "mañana" | "tarde" | "noche";
  usuarioId: number;
  nota?: string;
  detalles: {
    operarioId: number;
    maquinaId: number;
    piezaId: number;
    horaDesde: string; // "HH:mm"
    horaHasta: string; // "HH:mm"
    cantidad: number;
  }[];
}
export interface ProduccionInyeccionParams {
  page?: number;
  limit?: number;
  orden?: string;
  direccion?: "asc" | "desc";
  desde?: string;       // formato ISO: "2025-04-01"
  hasta?: string;       // formato ISO: "2025-04-30"
  turno?: "mañana" | "tarde" | "noche";
}
