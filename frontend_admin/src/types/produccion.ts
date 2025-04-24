export interface ReporteProduccion {
    id: number;
    fecha: string;
    productoId: number;
    cantidad?: number;
    usuarioId: number;
    turno?: "mañana" | "tarde" | "noche"; 
    plantaId?: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  
    producto?: {
      id: number;
      nombre: string;
      sku: string;
      precioUnitario: number;
      costoMP?: number;
    };
  
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

export interface CrearReporteProduccion {
    productoId: number;
    cantidad?: number;
    usuarioId: number;
  }
  
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
  
  