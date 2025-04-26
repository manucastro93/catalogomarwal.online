import { registrarLogCliente } from "@/services/cliente.service";

export function registrarBusqueda(busqueda: string) {
  const sesion = localStorage.getItem("sesionId") || crypto.randomUUID();
  localStorage.setItem("sesionId", sesion);

  const clienteIdRaw = localStorage.getItem("clienteId");
  const clienteId = clienteIdRaw ? Number(clienteIdRaw) : undefined;

  registrarLogCliente({
    ubicacion: "busqueda",
    busqueda,
    sesion,
    clienteId,
    referer: document.referrer,
  });
}
