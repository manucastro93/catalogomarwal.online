import { Rubro } from "./rubro";

export interface Material {
  id: number;
  codigo: string;
  descripcion?: string;
  rubroId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;
}
