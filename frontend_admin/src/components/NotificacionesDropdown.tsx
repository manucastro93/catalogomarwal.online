import { createResource, createSignal, For, Show } from 'solid-js';
import api from '../services/api';
import type { Notificacion }  from '../shared/types/notificacion.ts';
import { formatearFechaHora } from '../utils/fecha';

export default function NotificacionesDropdown() {
  const [abierto, setAbierto] = createSignal(false);

  const fetchNotificaciones = async () => {
    const { data } = await api.get('/notificaciones');
    return data;
  };

  const [notificaciones, { mutate, refetch }] = createResource(fetchNotificaciones);

  const marcarComoLeida = async (id: number) => {
    await api.put(`/notificaciones/${id}/leida`);
    refetch();
  };

  const noLeidas = () => notificaciones()?.filter((n: Notificacion) => !n.leida) || [];

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
          <div class="p-2 border-b font-semibold bg-amber-300">Notificaciones</div>
          <For each={notificaciones()}>
            {(n: Notificacion) => (
              <div
                class={`p-2 border-b cursor-pointer hover:bg-gray-100 ${
                  !n.leida ? 'font-semibold bg-gray-50' : 'text-gray-600'
                }`}
                onClick={() => marcarComoLeida(n.id)}
              >
                <h1 class="font-bold text-sm text-gray-700">{formatearFechaHora(n.createdAt)}</h1>
                <div>{n.titulo}</div>
                <div class="text-xs text-gray-500">{n.mensaje}</div>
              </div>
            )}
          </For>
          <Show when={!notificaciones() || notificaciones()?.length === 0}>
            <div class="p-4 text-center text-sm text-gray-500">Sin notificaciones</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
