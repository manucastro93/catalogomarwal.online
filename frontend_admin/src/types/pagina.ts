import type { Banner } from './banner';

export interface Pagina {
  id: number;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  Banners?: Banner[];
}
