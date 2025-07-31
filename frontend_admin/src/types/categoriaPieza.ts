import { Rubro } from "./rubro";

export interface CategoriaPieza {
  id: number;
  nombre: string;
  descripcion?: string;
  rubroId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;
}
