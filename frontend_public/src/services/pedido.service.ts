import type { PedidoPayload } from "../shared/types/pedido";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const enviarPedido = async (data: PedidoPayload) => {
  try {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.error || 'Error al enviar el pedido');
    }

    return await res.json();
  } catch (err) {
    console.error("❌ Error al enviar pedido:", err);
    throw err;
  }
};

export const obtenerMisPedidos = async () => {
  try {
    const res = await fetch(`${API_URL}/pedidos/mis-pedidos`);
    if (!res.ok) throw new Error('Error al obtener pedidos');
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener pedidos:", err);
    throw err;
  }
};

export const cancelarPedido = async (id: number) => {
  try {
    console.log("🛑 Intentando cancelar pedido:", id);

    const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelado' }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("❌ Error del backend:", data);
      throw new Error(data?.message || 'No se pudo cancelar el pedido');
    }

    console.log("✅ Pedido cancelado:", data);
    return data;
  } catch (err) {
    console.error("❌ Error general al cancelar pedido:", err);
    throw err;
  }
};

export const validarCarrito = async (carrito: any[]) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw data; // contiene mensaje y errores
    }

    return data; // { mensaje: "Carrito válido." }
  } catch (err) {
    console.error("❌ Error al validar carrito:", err);
    throw err;
  }
};
