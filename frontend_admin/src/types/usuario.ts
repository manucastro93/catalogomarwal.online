import type { PermisoUsuario } from "./permisoUsuario";

export type PersonalDux = {
  id: number;
  id_personal: number;
  nombre: string;
  apellido_razon_social: string;
};

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rolUsuarioId: number;
  contraseña?: string | null;
  link?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  personalDuxId: number | null;
  personalDux?: PersonalDux | null;
  permisos?: PermisoUsuario[];
  rolUsuario?: { nombre: string };
}
