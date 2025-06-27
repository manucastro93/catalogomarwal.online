export interface Categoria {
  id: number;
  nombre: string;
  nombreWeb: string;
  orden?: number;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategoria {
  id: number;
  nombre: string;
  categoriaId: number;
  orden?: number | null;
  estado?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
