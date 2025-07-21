export interface ClienteDux {
  id: number;
  fechaCreacion?: string;
  cliente?: string;
  categoriaFiscal?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  cuitCuil?: string;
  cobrador?: string;
  tipoCliente?: string;
  personaContacto?: string;
  noEditable?: boolean;
  lugarEntregaPorDefecto?: string;
  tipoComprobantePorDefecto?: string;
  listaPrecioPorDefecto?: string;
  habilitado?: boolean;
  nombreFantasia?: string;
  codigo?: string;
  correoElectronico?: string;
  vendedor?: string;
  provincia?: string;
  localidad?: string;
  barrio?: string;
  domicilio?: string;
  telefono?: string;
  celular?: string;
  zona?: string;
  condicionPago?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ClienteDuxPorMes {
  mes: string; // "2025-07"
  cantidad: number;
}

export interface ClienteDuxPorDia {
  fecha: string; // "2025-07-21"
  cantidad: number;
}

export interface FiltrosClientesDux {
  fechaDesde?: string;
  fechaHasta?: string;
  vendedor?: string;
  listaPrecio?: string;
}
