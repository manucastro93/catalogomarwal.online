export interface Banner {
  id: number;
  imagen: string;
  orden: number;
  fechaInicio: string | null;
  fechaFin: string | null;
  paginaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
