export interface Provincia {
    id: number;
    nombre: string;
  }
export interface Localidad {
    id: number;
    nombre: string;
    provinciaId: number;
  }
  
  export interface DireccionGoogle {
  descripcion: string;
  place_id: string;
  formatted?: string;
  components?: {
    city?: string;
    state?: string;
    postcode?: string;
    suburb?: string;
    road?: string;
    house_number?: string;
  };
}
