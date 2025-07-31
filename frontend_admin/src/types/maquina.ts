import { Rubro } from "./rubro";

export interface Maquina {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  rubroId: number;
  toneladas?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;
}
