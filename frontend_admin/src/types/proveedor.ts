export interface Proveedor {
  id: number;
  nombre: string;
  tipoDoc?: string | null;
  nroDoc?: string | null;
  provincia?: string | null;
  localidad?: string | null;
  domicilio?: string | null;
  barrio?: string | null;
  codPostal?: string | null;
  telefono?: string | null;
  fax?: string | null;
  companiaCelular?: string | null;
  celular?: string | null;
  personaContacto?: string | null;
  email?: string | null;
  paginaWeb?: string | null;
  createdAt: string;   // O Date si lo parseás
  updatedAt: string;   // O Date si lo parseás
  deletedAt?: string | null;

  // Relación opcional para mostrar los productos del proveedor
  Productos?: any[]; // Podés tipar esto como Producto[] si tenés el type Producto
}
