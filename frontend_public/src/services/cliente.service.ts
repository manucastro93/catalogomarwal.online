import api from './api';
import type { LogClienteInput, Cliente } from '@/types/cliente';

// 🔍 Registra una búsqueda del cliente en localStorage y servidor
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

// 📩 POST /public/logs
export const registrarLogCliente = async (data: LogClienteInput) => {
  const res = await api.post('/logs', data);
  return res.data;
};

// 🧠 GET /public/cliente-por-ip
export const detectarClientePorIp = async (): Promise<number | null> => {
  try {
    const res = await api.get('/cliente-por-ip');
    if (res.data?.clienteId) {
      localStorage.setItem("clienteId", res.data.clienteId.toString());
      return res.data.clienteId;
    }
    return null;
  } catch (err) {
    console.error("❌ No se pudo detectar cliente por IP:", err);
    return null;
  }
};

// 👤 GET /public/cliente/:id
export const obtenerClientePorId = async (id: number): Promise<Cliente> => {
  const res = await api.get(`/cliente/${id}`);
  return res.data;
};

// ☎️ GET /public/cliente-por-telefono/:numero
export const buscarClientePorTelefono = async (
  numero: string
): Promise<Cliente | null> => {
  try {
    const res = await api.get(`/cliente-por-telefono/${numero}`);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    console.error("❌ Error al buscar cliente por teléfono:", err);
    throw err;
  }
};

// ✅ POST /public/validar-whatsapp/enviar
export const enviarCodigoWhatsapp = async (telefono: string) => {
  const res = await api.post('/validar-whatsapp/enviar', { telefono });
  return res.data;
};

// 🔐 POST /public/validar-whatsapp/verificar
export const verificarCodigoWhatsapp = async (telefono: string, codigo: string) => {
  const res = await api.post('/validar-whatsapp/verificar', { telefono, codigo });
  return res.data;
};
