import api from "./api";
import type { Planta } from "@/types/planta";

export const obtenerPlantas = async (): Promise<Planta[]> => {
  const { data } = await api.get("/plantas");
  return data;
};
