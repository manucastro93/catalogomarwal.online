import type { MateriaPrima } from './materiaPrima';

export interface ComposicionProductoMateriaPrima {
  id: number;
  productoId: number;
  materiaPrimaId: number;
  cantidad: number;
  unidad: string;
  detalle?: string | null;
  MateriaPrima?: MateriaPrima | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProductoComposicion {
  id?: number; // (opcional, sólo si devolvés id de la fila)
  productoId: number;
  materiaPrimaId: number;
  cantidad: number;
  unidad?: string | null; // Si la guardás, ej: "KG", "MT", "UN"
  MateriaPrima?: {
    id: number;
    sku: string;
    nombre: string;
    unidadMedida?: string | null;
  }
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}
