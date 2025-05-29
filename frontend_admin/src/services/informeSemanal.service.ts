import api from "./api";

export async function obtenerInformeSemanalEnVivo(): Promise<{
  resumen: string;
  variacion: number;
  feriados: boolean;
}> {
  const res = await api.get("/informes-semanales/vivo");
  return res.data;
}


