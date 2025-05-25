import api from './api';
import type { LogClienteInput } from '@/types/cliente';

// Registra una búsqueda del cliente
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

// POST /public/logs-cliente
export const registrarLogCliente = async (data: LogClienteInput) => {
  const res = await api.post('/logs', data);
  return res.data;
};

// GET /public/cliente-por-ip
export const detectarClientePorIp = async () => {
  try {
    const res = await api.get('/cliente-por-ip');
    if (res.data?.clienteId) {
      localStorage.setItem("clienteId", res.data.clienteId.toString());
    }
  } catch (err) {
    console.error("❌ No se pudo detectar cliente por IP:", err);
  }
};

// GET /public/cliente/:id
export const obtenerClientePorId = async (id: number) => {
  const res = await api.get(`/cliente/${id}`);
  return res.data;
};


export const enviarCodigoWhatsapp = async (telefono: string) => {
  const res = await api.post('/validar-whatsapp/enviar', { telefono });
  return res.data;
};

export const verificarCodigoWhatsapp = async (telefono: string, codigo: string) => {
  const res = await api.post('/validar-whatsapp/verificar', { telefono, codigo });
  return res.data;
};
