import { createResource, createSignal, For, Show } from "solid-js";
import type { Notificacion } from "../../types/notificacion";
import { formatearFechaHora } from "../../utils/formato";
import {
  obtenerNotificaciones,
  marcarNotificacionComoLeida,
} from "../../services/notificacion.service";
import VerPedidoModal from "../Pedido/VerPedidoModal";
import { obtenerPedidoPorId } from "../../services/pedido.service";
import type { Pedido } from "../../types/pedido";

export default function NotificacionesDropdown() {
  const [abierto, setAbierto] = createSignal(false);
  const [pedido, setPedido] = createSignal<Pedido | null>(null);

  const [notificaciones, { refetch }] = createResource(obtenerNotificaciones);

  const noLeidas = () =>
    notificaciones()?.filter((n: Notificacion) => !n.leida) || [];

  const manejarClickNotificacion = async (notificacion: Notificacion) => {
    await marcarNotificacionComoLeida(notificacion.id);
    refetch();

    if (notificacion.pedidoId) {
      const pedidoCompleto = await obtenerPedidoPorId(notificacion.pedidoId);
      setAbierto(false);
      setPedido(pedidoCompleto);
    }
  };

  return (
    <div class="relative">
      <button onClick={() => setAbierto(!abierto())} class="relative">
        <span class="text-2xl">🔔</span>
        <Show when={noLeidas().length > 0}>
          <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas().length}
          </span>
        </Show>
      </button>

      <Show when={abierto()}>
        <div class="absolute right-0 mt-2 w-80 bg-white border rounded shadow z-50 max-h-96 overflow-auto">
          <div class="p-2 border-b font-semibold bg-amber-300">
            Notificaciones
          </div>
          <For each={notificaciones()}>
            {(n: Notificacion) => (
              <div
                class={`p-2 border-b cursor-pointer hover:bg-gray-100 ${
                  !n.leida ? "font-semibold bg-gray-200" : "text-gray-600"
                }`}
                onClick={() => manejarClickNotificacion(n)}
              >
                <h1 class="font-bold text-sm text-gray-700">
                  {formatearFechaHora(n.createdAt)}
                </h1>
                <div>{n.titulo}</div>
                <div class="text-xs text-gray-500">{n.mensaje}</div>
              </div>
            )}
          </For>
          <Show when={!notificaciones() || notificaciones()?.length === 0}>
            <div class="p-4 text-center text-sm text-gray-500">
              Sin notificaciones
            </div>
          </Show>
        </div>
      </Show>
      <VerPedidoModal pedido={pedido()} onClose={() => setPedido(null)} />
    </div>
  );
}
