import { Show, For } from 'solid-js';
import type { OrdenTrabajo } from '@/types/ordenTrabajo';
import { formatearFechaCorta } from '@/utils/formato';

type Props = {
  otsPendientes: { loading: boolean; error: any; data?: OrdenTrabajo[] };
  onClose: () => void;
  onSeleccionar: (ot: OrdenTrabajo) => void;
};

export default function SelectorOTPendienteModal(props: Props) {
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-gray-100 relative">
  <h2 class="text-xl font-bold mb-6 text-gray-800">
    Seleccioná una OT pendiente
  </h2>
  <button
    onClick={props.onClose}
    class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
    title="Cerrar"
  >
    ×
  </button>

  <Show when={props.otsPendientes.data && props.otsPendientes.data.length > 0}>
    <ul class="space-y-4">
      <For each={props.otsPendientes.data ?? []}>
        {(ot) => (
          <li class="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 shadow-sm hover:bg-blue-50 transition">
            <span class="font-medium text-gray-700 text-sm">
              Órden #{ot.id} — {ot.planta?.nombre} — {formatearFechaCorta(ot.fecha)} — <span class="capitalize">Turno {ot.turno}</span>
            </span>
            <button
              onClick={() => props.onSeleccionar(ot)}
              class="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1 rounded transition text-sm shadow"
            >
              Seleccionar
            </button>
          </li>
        )}
      </For>
    </ul>
  </Show>
  <button
    onClick={props.onClose}
    class="block mx-auto mt-8 text-sm text-red-600 hover:underline"
  >
    Cerrar
  </button>
</div>

    </div>
  );
}
