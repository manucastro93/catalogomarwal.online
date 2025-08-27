export type YearKey =
  | "ene" | "feb" | "mar" | "abr" | "may" | "jun"
  | "jul" | "ago" | "sep" | "oct" | "nov" | "dic";

export type YearRow = Record<YearKey, number>;

export type SerieConVar = {
  valores: YearRow;
  variacion: YearRow;
};

export type ResumenFinanzas = {
  anio: number;
  facturacion: SerieConVar;
  cmv: SerieConVar;
  resultadoBruto: SerieConVar;
  gastos: SerieConVar;
  resultadoFinal: SerieConVar;
  totales: {
    facturacion: number;
    cmv: number;
    gastos: number;
    resultadoBruto: number;
    resultadoFinal: number;
  };
};

export type GastoCategoria = {
  categoriaId: string | number;
  categoriaNombre: string;
  valores: YearRow;
  variacion: YearRow;
  total: number;
};

export type GastoProveedor = {
  proveedorId: string | number;
  proveedorNombre: string;
  valores: YearRow;
  variacion: YearRow;
  total: number;
};

export type GastoDetalle = {
  id: number;
  fecha: string;
  tipoComprobante: string | null;
  comprobante: string | null;
  categoriaId: number | null;
  categoriaNombre: string;
  proveedorId: number | null;
  proveedorNombre: string;
  proveedorRazonSocial: string | null;
  detalles: string | null;
  total: number;
  montoPagado: number;
  saldo: number;
  estadoFacturacion: string | null;
  observaciones: string | null;
};
