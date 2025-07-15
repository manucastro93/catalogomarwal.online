export interface MateriaPrima {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string | null;
  activo: boolean;
  costoDux: number;
  unidadMedida?: 'KG' | 'MT' | 'UN' | 'LT' | null;
  largo?: number | null;
  ancho?: number | null;
  alto?: number | null;
  peso?: number | null;
  stock: number;
  stockMinimo?: number | null;
  stockMaximo?: number | null;
  observaciones?: string | null;
  subcategoriaId?: number | null;
  Subcategoria?: {
    id: number;
    nombre: string;
  } | null;
  proveedorId?: number | null;
  Proveedor?: {
    id: number;
    nombre: string;
    // podés sumar otros campos del proveedor que quieras mostrar en el front
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
