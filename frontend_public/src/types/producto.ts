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
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  precioUnitario: number;
  precioPorBulto?: number;
  unidadPorBulto?: number;
  categoriaId: number;
  Categoria?: Categoria;
  Imagenes?: ImagenProducto[]; 
}
