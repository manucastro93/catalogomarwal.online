import { createResource, Show, For } from 'solid-js';
import dayjs from 'dayjs';
import { obtenerHistorialCliente } from '../../../services/cliente.service'; // ruta según tu estructura
import type { HistorialCambio } from '../../../types/cliente';

interface Props {
  clienteId: number;
}

export default function TabHistorialCliente(props: Props) {
  const [historial] = createResource(() => props.clienteId, obtenerHistorialCliente);

  return (
    <div class="space-y-3">
      <Show when={historial.loading}>
        <p>Cargando historial...</p>
      </Show>

      <Show when={historial.error}>
        <p class="text-red-600">Error al cargar el historial.</p>
      </Show>

      <Show when={historial()?.length}>
  <For each={historial()!}>
    {(cambio) => (
      <div class="border rounded-md p-4 bg-gray-50">
        <p><strong>Campo:</strong> {cambio.campo}</p>
        <p><strong>Antes:</strong> {cambio.anterior}</p>
        <p><strong>Después:</strong> {cambio.nuevo}</p>
        <p class="text-xs text-gray-500 mt-1">
          {dayjs(cambio.createdAt).format('DD/MM/YYYY HH:mm')}
        </p>
      </div>
    )}
  </For>
</Show>

    </div>
  );
}
