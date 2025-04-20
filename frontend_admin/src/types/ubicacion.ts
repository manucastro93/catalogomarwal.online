export interface Provincia {
  id: number;
  nombre: string;
}

export interface Localidad {
  id: number;
  nombre: string;
  provinciaId: number;
}

// Versión combinada útil para autocompletado u operaciones en frontend
export interface Ubicacion {
  id: number;
  nombre: string;
  codigoPostal: string;
  localidadId: number;
  provinciaId: number;
}
