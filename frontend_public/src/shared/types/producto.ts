import type { Categoria } from './categoria';

export interface ImagenProducto {
  id: number;
  url: string;
  productoId: number;
}

export interface Producto {
  id: number;
  sku: string;
  nombre?: string;
  descripcion?: string;
  hayStock?: boolean;
  precioUnitario: number;
  precioPorBulto?: number;
  unidadPorBulto?: number;
  categoriaId: number;
  Categoria?: Categoria;
  Imagenes?: ImagenProducto[]; 
}
