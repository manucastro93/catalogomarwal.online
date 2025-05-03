import api from "./api";

export async function obtenerInformeSemanalEnVivo(): Promise<{ resumen: string }> {
  const { data } = await api.get("/informes-semanales/vivo");
  return data;
}

