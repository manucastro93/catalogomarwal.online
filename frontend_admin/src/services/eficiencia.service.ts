import api from "./api";

export async function fetchResumenEjecutivo(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/resumen", { params });
  return data;
}

export async function fetchEvolucionEficiencia(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/evolucion", { params });
  return data; // [{ fecha: '2024-05-01', leadTime: 4.2 }, ...]
}

export async function fetchEvolucionFillRate(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/evolucion-fillrate", { params });
  return data; // [{ fecha: '2024-05-01', fillRate: 94.2 }, ...]
}

export async function fetchOutliersFillRate(params: {
  desde: string;
  hasta: string;
}) {
  const { data } = await api.get("/eficiencia/outliers-fillrate", { params });
  return data; // [{ codItem, descripcion, pedidas, facturadas, fillRate }]
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
export const fetchEvolucionEficienciaMensual = async (hasta: string) => {
  const res = await api.get("/eficiencia/evolucion-fillrate-mensual", {
    params: { hasta },
  });
  return res.data;
};

export const fetchEvolucionEficienciaMensualPorCliente = async (hasta: string, cliente: string) => {
  const res = await api.get("/eficiencia/evolucion-fillrate-mensual-cliente", {
    params: { hasta, cliente }, 
  });
  return res.data;
};
