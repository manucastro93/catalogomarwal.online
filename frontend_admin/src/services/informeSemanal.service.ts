import api from "./api";

export async function obtenerInformeSemanalEnVivo(): Promise<{ html: string }> {
  const res = await api.get("/informes-semanales/vivo");
  return res.data;
}


