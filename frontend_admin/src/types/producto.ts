import type { Categoria } from './categoria';

export interface ImagenProducto {
  id: number;
  url: string;
  orden?: number;
  productoId: number;
}

export interface Producto {
  id: number;
  sku: string;
  nombre?: string | null;
  descripcion?: string | null;
  activo: boolean;
  precioUnitario: number;
  precioPorBulto?: number | null;
  unidadPorBulto?: number | null;
  categoriaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  Categoria?: Categoria;
  Imagenes?: ImagenProducto[];
}