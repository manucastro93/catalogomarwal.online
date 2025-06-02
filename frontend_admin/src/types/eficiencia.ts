export interface EficienciaBase {
  cantidadPedida: number;
  cantidadFacturada: number;
  fillRate: number | null;
  fillRatePonderado: number | null;
  leadTimeDias?: number | null; // solo para eficiencia por pedido
  leadTimePromedio?: number | null; // usado en cliente, producto, categoría
  totalPedido?: number;
  totalFacturado?: number;
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
