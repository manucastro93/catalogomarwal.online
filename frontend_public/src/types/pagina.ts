import type { Banner } from './banner';

export interface Pagina {
  id: number;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  Banners?: Banner[];
}
