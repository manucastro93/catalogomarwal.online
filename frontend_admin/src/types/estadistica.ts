export interface PuntoEstadistica {
  fecha: string;   // formato YYYY-MM-DD
  total: number;   // facturación
  cantidad: number; // cantidad de pedidos
}

// ========== RESUMEN ==========

export interface ResumenEstadisticas {
  totalPedidos: number;
  totalFacturado: number;
  productoEstrella: ProductoEstrella | null;
  vendedorTop: VendedorTop | null;
  categoriaTop: CategoriaTop | null;
  mejoresClientes: ClienteTop[];
}

export interface ProductoEstrella {
  productoId: number;
  totalVendidas: number;
  totalFacturado: number;
  Producto: {
    nombre: string;
    imagenUrl: string | null;
  };
}

export interface VendedorTop {
  usuarioId: number;
  cantidad: number;
  totalFacturado: number;
  usuario: {
    nombre: string;
  };
}

export interface CategoriaTop {
  nombre: string;
}

export interface ClienteTop {
  clienteId: number;
  totalGastado: number;
  cliente: {
    nombre: string;
  };
}

// ========== COMPARACIÓN DE RANGOS ==========

export interface ComparacionRangos {
  rango1: DatosRango;
  rango2: DatosRango;
}

export interface DatosRango {
  totalPedidos: number;
  totalFacturado: number;
  productoTop: {
    productoId: number;
    cantidad: number;
    Producto: {
      nombre: string;
    };
  } | null;
}

// ========== RANKING ==========

export interface RankingEstadisticas {
  productos: ProductoRanking[];
  vendedores: VendedorRanking[];
  clientes: ClienteRanking[];
  categorias: CategoriaRanking[];
}

export interface ProductoRanking {
  productoId: number;
  cantidadVendida: number;
  totalFacturado: number;
  Producto: {
    nombre: string;
  };
}

export interface VendedorRanking {
  usuarioId: number;
  totalPedidos: number;
  totalFacturado: number;
  usuario: {
    nombre: string;
  };
}

export interface ClienteRanking {
  clienteId: number;
  cantidadPedidos: number;
  totalGastado: number;
  cliente: {
    nombre: string;
  };
}

export interface CategoriaRanking {
  categoriaId: number;
  totalFacturado: number;
  Producto: {
    Categoria: {
      nombre: string;
    };
  };
}
