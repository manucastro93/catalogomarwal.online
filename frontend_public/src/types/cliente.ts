import type { Provincia } from './ubicacion';
import type { Localidad } from './ubicacion';
import type { Vendedor } from './vendedor';

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
  deletedAt?: string | null;

  provincia?: Provincia;
  localidad?: Localidad;
  vendedor?: Vendedor;
}


export type LogClienteInput = {
  categoriaId?: number;
  busqueda?: string;
  tiempoEnPantalla?: number;
  ubicacion?: string;
  sesion?: string;
  clienteId?: number;
  referer?: string;
};
