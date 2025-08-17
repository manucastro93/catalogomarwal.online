// types/estadistica.ts

export interface PuntoEstadistica {
  fecha: string;    // YYYY-MM-DD
  total: number;    // facturación
  cantidad: number; // cantidad de pedidos
}

/** ---- Cards / entidades simples ---- */

export interface ProductoMini {
  nombre: string | null;
  imagenUrl: string | null;
}

export interface ProductoEstrella {
  productoId: number;           // 0 cuando viene de Dux y no matchea con Productos locales
  totalVendidas: number;
  totalFacturado: number;
  Producto: ProductoMini;
}

export interface VendedorTop {
  usuarioId: number | null;
  cantidad: number;
  totalFacturado: number;
  usuario: { nombre: string };
  vendedorId?: number | null;
}

export interface CategoriaTop {
  nombre: string;
}

export interface ClienteTop {
  clienteId: number;
  totalGastado: number;
  cliente: { nombre: string };
  cantidadPedidos?: number;
}

/** ---- Ítems para los rankings TOP 5 ---- */

export interface ProductoRankingItem {
  productoId: number;           // 0 cuando no matchea con Productos locales
  cantidadVendida: number;
  totalFacturado: number;
  Producto: ProductoMini;
}

export interface VendedorRankingItem {
  usuarioId: number | null;     // null en Dux
  totalPedidos: number;
  totalFacturado: number;
  usuario: { nombre: string };
  vendedorId?: number | null;   // id_personal (Dux) si aplica
}

export interface CategoriaRankingItem {
  categoriaId: number;
  nombre: string;
  totalVendidas: number;
  totalFacturado: number;
}

export interface ClienteRankingItem {
  // en local podés tener id; en Dux no
  clienteId?: number;
  totalGastado: number;
  cantidadPedidos: number;
  cliente: { nombre: string };
}

/** ---- contenedores de rankings por criterio ---- */

export interface ListaTop<T> {
  porCantidad: T[]; // ordenado DESC por cantidad
  porMonto: T[];    // ordenado DESC por totalFacturado / totalGastado
}

export interface Rankings {
  productos: {
    local: ListaTop<ProductoRankingItem>;
    dux:   ListaTop<ProductoRankingItem>;
  };
  vendedores: {
    local: ListaTop<VendedorRankingItem>;
    dux:   ListaTop<VendedorRankingItem>;
  };
  categorias: {
    local: ListaTop<CategoriaRankingItem>;
    dux:   ListaTop<CategoriaRankingItem>;
  };
  clientes: {
    local: ListaTop<ClienteRankingItem>;
    dux:   ListaTop<ClienteRankingItem>;
  };
}

/** ---- respuesta principal del endpoint ---- */
export interface ResumenEstadisticas {
  // Totales combinados
  totalPedidos: number;
  totalFacturado: number;

  // Totales por origen
  totalPedidosLocal: number;
  totalPedidosDux: number;
  totalFacturadoLocal: number;
  totalFacturadoDux: number;

  // Cards existentes (compatibles con tu UI actual)
  productoEstrella: ProductoEstrella | null; // local (por cantidad)
  vendedorTop: VendedorTop | null;           // combinado (mejor entre local/dux)
  categoriaTop: CategoriaTop | null;         // local (por monto)
  mejoresClientes: ClienteTop[];             // local o Dux (fallback)

  // NUEVOS opcionales si querés mostrarlos también como cards de Dux
  productoEstrellaDux?: ProductoEstrella | null; // Dux (por cantidad)
  categoriaTopDux?: CategoriaTop | null;         // Dux (por monto)

  // Rankings TOP 5 por cantidad y por monto
  rankings: Rankings;
}
