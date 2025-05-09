interface FiltrosVentas {
    cliente?: string;
    categoriaId?: string;
    producto?: string;
  }
  
  export function deberiaMostrarGraficoVentas(
    tipo: "cliente" | "vendedor" | "categoria",
    filtros: FiltrosVentas
  ): boolean {
    if (tipo === "cliente" && filtros.cliente) return false;
    if (tipo === "categoria" && filtros.categoriaId) return false;
    return true;
  }
  