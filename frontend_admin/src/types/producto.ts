import type { Categoria, Subcategoria } from './categoria';

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
  costoMP?: number | null;
  tiempoProduccionSegundos?: number | null;
  costoSistema?: number | null;
  categoriaId: number;
  subcategoriaId?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  stock?: number;
  marcaId?: number | null;
  costoDux?: number | null;
  Categoria?: Categoria;
  Subcategoria?: Subcategoria;
  Marca?: { id: number; nombre: string };
  Imagenes?: ImagenProducto[];
}

export interface ProductoPendiente {
  codItem: string;
  stock: number;
  descripcion: string;
  categoria: string;
  cantidad_pedida: number;
  cantidad_facturada: number;
  cantidad_pendiente: number;
  fabricar: number;
}
