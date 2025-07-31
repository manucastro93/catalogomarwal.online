import { Rubro } from "./rubro";
import { Material } from "./material";
import { CategoriaPieza } from "./categoriaPieza";

export interface Pieza {
  id: number;
  codigo: string;
  descripcion?: string;
  categoria: number;       // FK a CategoriaPieza
  pzsXSeg?: number;
  cicloXSeg?: number;
  ciclosXTurno?: number;
  cavidades?: number;
  peso?: number;
  material?: number;       // FK a Material
  colada?: string;
  rubroId: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  rubro?: Rubro;                   // include opcional
  materialObj?: Material;          // include opcional
  categoriaPieza?: CategoriaPieza; // include opcional
}
