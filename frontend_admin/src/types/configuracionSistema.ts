export interface ConfiguracionSistema {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
