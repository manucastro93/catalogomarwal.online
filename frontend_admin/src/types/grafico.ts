import type { Producto } from "./producto"; 

export interface ResumenProduccion {
    fecha: string;
    planta: string;
    categoria: string;
    turno: string;
    producto: Pick<Producto, "id" | "nombre" | "sku">;
    cantidad: number; 
    totalCostoDux: number;
    totalValor: number;
}
  
export interface ResumenProduccionPlanta {
    planta: string;
    totalCantidad: number;
    totalCostoDux: number;
    totalValor: number;
}
  
export interface ResumenProduccionCategoria {
    categoria: string;
    totalCantidad: number;
    totalCostoDux: number;
    totalValor: number;
}
  
export interface ResumenProduccionTurno {
    turno: string;
    totalCantidad: number;
    totalCostoDux: number;
    totalValor: number;
}

export interface ResumenProduccionGeneral {
    totalCostoDux: number;
    totalValor: number;
    totalCantidad?: number;
}

export interface RespuestaResumenProduccion {
    items: ResumenProduccion[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export interface EvolucionProduccion {
  periodo: string;
  totalCantidad: number;
  totalValor: number;
}
