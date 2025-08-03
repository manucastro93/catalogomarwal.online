import { Rubro } from "./rubro";
import { Material } from "./material";
import { CategoriaPieza } from "./categoriaPieza";

export interface Pieza {
  id: number;
  codigo: string;
  descripcion?: string;
  categoriaPiezaId: number;
  pzsXSeg?: number;
  cicloXSeg?: number;
  ciclosXTurno?: number;
  cavidades?: number;
  peso?: number;
  material?: number;
  colada?: string;
  rubroId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;
  materialObj?: Material;
  categoriaPieza?: CategoriaPieza;
}
