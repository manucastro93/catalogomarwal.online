import api from "./api";

export async function obtenerInformeSemanalEnVivo(): Promise<{ resumen: string }> {
  const res = await api.get("/informes-semanales/vivo");
  return { resumen: res.data.informe };
}


