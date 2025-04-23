export interface ReporteProduccion {
    id: number;
    productoId: number;
    cantidad?: number;
    usuarioId: number;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
  
    // Relaciones opcionales
    producto?: {
      id: number;
      nombre: string;
      sku: string;
      precioUnitario: number;
    };
  
    usuario?: {
      id: number;
      nombre: string;
      email: string;
    };
  }

export interface CrearReporteProduccion {
    productoId: number;
    cantidad?: number;
    usuarioId: number;
  }
  