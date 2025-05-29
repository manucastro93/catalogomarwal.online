export interface DetalleFacturaDux {
  cod_item: string;
  item: string;
  ctd: number;
  precio_uni: number;
  porc_desc: number;
  porc_iva: number;
  comentarios?: string | null;
  costo?: number;
}

export interface CobroFacturaDux {
  tipo_de_valor: string;
  referencia: string;
  monto: number;
}

export interface DetallesCobroFacturaDux {
  numero_punto_de_venta: number;
  numero_comprobante: number;
  personal: string;
  caja: string;
  detalles_mov_cobro: CobroFacturaDux[];
}

export interface FacturaDux {
  id: number;
  id_cliente: number;
  id_empresa: number;
  nro_pto_vta: string;
  id_personal: number;
  nro_doc: number;
  tipo_comp: string;
  letra_comp: string;
  nro_comp: number;
  fecha_comp: string;
  total: number;
  apellido_razon_soc: string;
  nombre: string;
  nro_cae_cai: string;
  fecha_vencimiento_cae_cai: string;
  anulada: string;
  anulada_boolean: boolean;
  fecha_registro: string;
  personal: string;
  detalles: {
    cod_item: string;
    item: string;
    ctd: number;
    precio_uni: number;
  }[];
}

export interface EstadoFactura {
  id: number;
  nombre: string;
}
