import type { Provincia } from './ubicacion';
import type { Localidad } from './ubicacion';
import type { Usuario } from './usuario';

export interface HistorialCambio {
  id: number;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  createdAt: string;
  usuario?: {
    id: number;
    nombre: string;
  };
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  razonSocial?: string;
  nro_doc: string;
  transporte?: string;
  provinciaId?: number;
  localidadId?: number;
  vendedorId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  latitud?: number | null;
  longitud?: number | null;

  provincia?: Provincia;
  localidad?: Localidad;
  vendedor?: Usuario;

  totalVentas?: number;
}
