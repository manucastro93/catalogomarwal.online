import type { Provincia } from './ubicacion';
import type { Localidad } from './ubicacion';
import type { Usuario } from './usuario';

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  razonSocial?: string;
  cuit_cuil: string;
  provinciaId?: number;
  localidadId?: number;
  vendedorId?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  // Relaciones
  provincia?: Provincia;
  localidad?: Localidad;
  vendedor?: Usuario;
}
