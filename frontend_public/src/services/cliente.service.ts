const API_URL = import.meta.env.VITE_BACKEND_URL;

export interface LogClienteInput {
  categoriaId?: number;
  busqueda?: string;
  tiempoEnPantalla?: number;
  ubicacion?: string;
  sesion?: string;
  clienteId?: number; 
  referer?: string;
}

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

export const registrarLogCliente = async (data: LogClienteInput) => {
  try {
    const res = await fetch(`${API_URL}/logs-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al registrar log del cliente');
    return await res.json();
  } catch (error) {
    console.error('❌ Error al registrar log cliente:', error);
  }
};

export const detectarClientePorIp = async () => {
  try {
    const res = await fetch(`${API_URL}/public/cliente-por-ip`);
    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const data = await res.json();
      if (data?.clienteId) {
        localStorage.setItem("clienteId", data.clienteId.toString());
        console.log("🟢 clienteId detectado por IP:", data.clienteId);
      }
    } else {
      console.warn("ℹ️ No se encontró cliente por IP");
    }
  } catch (err) {
    console.error("❌ No se pudo detectar cliente por IP:", err);
  }
};
