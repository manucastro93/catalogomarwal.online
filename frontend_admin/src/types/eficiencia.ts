export interface EficienciaBase {
  cantidadPedida: number;
  cantidadFacturada: number;
  fillRate: number | null;
  fillRatePonderado: number | null;
  leadTimeDias?: number | null; // solo para eficiencia por pedido
  leadTimePromedio?: number | null; // usado en cliente, producto, categoría
  totalPedido?: number;
  totalFacturado?: number;
  leadTimeItem: number;
}

export interface EficienciaPedido extends EficienciaBase {
  tipo: "pedido";
  nroPedido: string;
  fecha: string;
  fechasFacturas?: string[];
}

export interface EficienciaCategoria extends EficienciaBase {
  tipo: "categoria";
  categoria: string;
  categoriaNombre: string;
  leadTimePromedio: number;
}

export interface EficienciaProducto extends EficienciaBase {
  tipo: "producto";
  producto: string;
  codItem: string;
  leadTimePromedio: number;
}

export interface EficienciaCliente extends EficienciaBase {
  tipo: "cliente";
  cliente: string;
  leadTimePromedio: number;
  totalPedido: number;
  totalFacturado: number;
}

export type EficienciaItem =
  | EficienciaPedido
  | EficienciaCategoria
  | EficienciaProducto
  | EficienciaCliente;

  export interface EficienciaMensual {
    mes: string; // ej: "2023-09"
    fillRate: number;
    leadTime: number;
  }

export interface ResumenEficiencia {
  totalPedidos: number;
  totalFacturas: number;
  fillRateGeneral: number;
  variacionFillRate: number;
  leadTimePromedioDias: number;
  variacionLeadTime: number;
  cantidadRetrasos: number;
  porcentajePedidosAltosFillRate: number;
  porcentajePedidosBajoFillRate: number;
  topClientesEficientes: { cliente: string; fillRate: number }[];
  topClientesIneficientes: { cliente: string; fillRate: number }[];
  topProductosProblema: { producto: string; sinFacturar: number }[];
  categoriasCriticas: string[];
}