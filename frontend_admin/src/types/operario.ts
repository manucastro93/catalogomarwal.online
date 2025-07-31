import { Rubro } from "./rubro";

export interface Operario {
  id: number;
  codigo: string;
  nombre: string;
  apellido: string;
  rubroId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;
}
