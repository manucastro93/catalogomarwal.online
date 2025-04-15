import { onCleanup } from "solid-js";
import { registrarLogCliente } from "../services/cliente.service";

export function useLogTiempo({ ubicacion, categoriaId }: { ubicacion: string; categoriaId?: number }) {
  const inicio = Date.now();

  const sesion = localStorage.getItem("sesionId") || crypto.randomUUID();
  localStorage.setItem("sesionId", sesion);

  const clienteIdRaw = localStorage.getItem("clienteId");
  const clienteId = clienteIdRaw ? Number(clienteIdRaw) : undefined;

  onCleanup(() => {
    const fin = Date.now();
    const tiempo = Math.round((fin - inicio) / 1000);

    registrarLogCliente({
      ubicacion,
      categoriaId,
      tiempoEnPantalla: tiempo,
      sesion,
      referer: document.referrer,
      clienteId,
    });
  });
}
