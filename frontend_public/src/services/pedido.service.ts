import type { PedidoPayload, Pedido } from "../types/pedido";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const enviarPedido = async (
  data: PedidoPayload
): Promise<{ pedidoId: number; clienteId: number }> => {
  try {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw {
        status: res.status,
        mensaje: json?.mensaje || 'Error al enviar el pedido',
        errores: json?.errores || [],
        carritoActualizado: json?.carritoActualizado || [],
      };
    }

    return json;
  } catch (err) {
    console.error("❌ Error al enviar pedido:", err);
    throw err;
  }
};


export const obtenerMisPedidos = async (): Promise<Pedido[]> => {
  try {
    const res = await fetch(`${API_URL}/public/pedidos/id-cliente`);
    if (!res.ok) throw new Error('Error al obtener pedidos');
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener pedidos:", err);
    throw err;
  }
};

export const obtenerPedidoPorId = async (
  id: number
): Promise<Pedido> => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.message || 'Error al obtener el pedido');
    }
    return await res.json();
  } catch (err) {
    console.error("❌ Error al obtener pedido por ID:", err);
    throw err;
  }
};

export const marcarComoEditando = async (id: number): Promise<void> => {
  try {
    await fetch(`${API_URL}/pedidos/${id}/editando`, { method: 'PUT' });
  } catch (err) {
    console.error("❌ Error al marcar como editando:", err);
    throw err;
  }
};

export const revertirEditando = async (id: number): Promise<void> => {
  try {
    await fetch(`${API_URL}/pedidos/${id}/revertir-editando`, { method: 'PUT' });
  } catch (err) {
    console.error("❌ Error al revertir edición:", err);
    throw err;
  }
};

export const cancelarPedido = async (
  id: number
): Promise<{ message: string; estado: string }> => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelado' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'No se pudo cancelar el pedido');
    }
    return data;
  } catch (err) {
    console.error("❌ Error al cancelar pedido:", err);
    throw err;
  }
};

export const validarCarrito = async (
  carrito: any[]
): Promise<{ detalles: any[]; total: number }> => {
  try {
    const res = await fetch(`${API_URL}/pedidos/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrito }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  } catch (err) {
    console.error("❌ Error al validar carrito:", err);
    throw err;
  }
};

export const duplicarPedido = async (
  pedidoId: number
): Promise<{ message: string; pedidoId: number; clienteId: number }> => {
  try {
    const res = await fetch(`${API_URL}/pedidos/duplicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedidoId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error al duplicar el pedido');
    }
    return data;
  } catch (err) {
    console.error("❌ Error al duplicar el pedido:", err);
    throw err;
  }
};

export const cancelarPedidoDesdeCliente = async (
  id: number
): Promise<{ message: string }> => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}/cancelar-desde-cliente`, {
      method: 'PUT'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'No se pudo cancelar el pedido');
    }
    return data;
  } catch (err) {
    console.error("❌ Error al cancelar pedido desde cliente:", err);
    throw err;
  }
};

