export interface ResumenProduccion {
    fecha: string;
    planta: string;
    categoria: string;
    turno: string;
    totalCostoMP: number;
    totalPrecioUnitario: number;
  }
  
  export interface ResumenProduccionPlanta {
    planta: string;
    totalCostoMP: number;
    totalPrecioUnitario: number;
  }
  
  export interface ResumenProduccionCategoria {
    categoria: string;
    totalPrecioUnitario: number;
  }
  
  export interface ResumenProduccionTurno {
    turno: string;
    totalPrecioUnitario: number;
  }
  
  export interface ResumenProduccionGeneral {
    totalCostoMP: number;
    totalPrecioUnitario: number;
  }
  