export interface Provincia {
    id: number;
    nombre: string;
  }
export interface Localidad {
    id: number;
    nombre: string;
    provinciaId: number;
  }
  