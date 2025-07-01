import api from "./api";
import type { CrearOrdenTrabajo } from "@/types/ordenTrabajo";

export const obtenerOrdenesTrabajo = async (params: any) => {
  const { data } = await api.get("/ordenes-trabajo", { params });
  return data;
};

export const guardarOrdenTrabajo = async (orden: CrearOrdenTrabajo) => {
  const { data } = await api.post("/ordenes-trabajo", orden);
  return data;
};

export const eliminarOrdenTrabajo = async (id: number) => {
  const { data } = await api.delete(`/ordenes-trabajo/${id}`);
  return data;
};
