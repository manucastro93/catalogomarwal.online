import api from "./api";
import type { ClienteFactura } from '@/types/cliente';

export async function fetchResumenEjecutivo(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/resumen", { params });
  return data;
}

export async function fetchEficienciaPorPedido(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/por-pedido", { params });
  return data; // [{ nroPedido, fechaPedido, fechaFactura, leadTime, fillRate }]
}

export async function fetchEficienciaPorProducto(params: any) {
  const { data } = await api.get("/eficiencia/por-producto", { params });
  return data;
}

export async function fetchEficienciaPorCategoria(params: any) {
  const { data } = await api.get("/eficiencia/por-categoria", { params });
  return data;
}

export async function fetchEficienciaPorCliente(params: {
  desde: string;
  hasta: string;
  cliente?: string;
  personalDuxId?: string;
}) {
  const { data } = await api.get("/eficiencia/por-cliente", { params });
  return data;
}

export async function fetchDetalleProducto(params: {
  desde: string;
  hasta: string;
  producto: string;
}) {
  const { data } = await api.get("/eficiencia/por-producto/detalle", {
    params,
  });
  return data;
}

export async function fetchDetalleCliente(params: {
  desde: string;
  hasta: string;
  cliente: string;
}) {
  const { data } = await api.get("/eficiencia/por-cliente/detalle", { params });
  return data;
}

export async function fetchDetalleCategoria(params: {
  desde: string;
  hasta: string;
  categoriaId: string;
}) {
  const { data } = await api.get("/eficiencia/por-categoria/detalle", {
    params,
  });
  return data;
}

export async function fetchDetallePorPedido(pedidoId: number | string) {
  const { data } = await api.get("/eficiencia/por-pedido/detalle", {
    params: { pedidoId },
  });
  return data;
}

export async function fetchEvolucionEficienciaMensual(params: {
  desde: string;
  hasta: string;
  cliente: string;
}) {
  const { data } = await api.get("/eficiencia/evolucion-fillrate-mensual", {
    params,
  });
  return data;
}

export const buscarClientesFacturas = async (texto: string): Promise<ClienteFactura[]> => {
  const { data } = await api.get("/eficiencia/clientes-sugeridos", {
    params: { buscar: texto, limit: 20 },
  });
  console.log(data)
  return data.data || [];
};
