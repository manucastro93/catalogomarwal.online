import { For, Show, createResource } from 'solid-js';
import type { Cliente } from '../../types/cliente';
import { obtenerLogsCliente } from '../../services/log.service';
import { formatearFechaHora } from '../../utils/formato';

interface Props {
  clienteId: number;
}

export default function TabActividadCliente({ clienteId }: Props) {
  const [logs] = createResource(() => clienteId, obtenerLogsCliente);

  return (
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-4">Actividad reciente del cliente</h3>
      <Show when={logs.loading}>
        <p>Cargando logs...</p>
      </Show>
      <Show when={logs()?.length === 0}>
        <p>Este cliente no tiene registros de actividad.</p>
      </Show>
      <Show when={logs()?.length}>
        <ul class="space-y-3">
          <For each={logs()}>
            {(log) => (
              <li class="border rounded p-3">
                <div class="text-sm text-gray-600 mb-1">
                  <strong>{formatearFechaHora(log.createdAt)}</strong> — {log.fuente || 'Fuente desconocida'}
                </div>
                <div class="text-sm">
                  {log.busqueda && <div>🔍 <strong>Búsqueda:</strong> {log.busqueda}</div>}
                  {log.ubicacion && <div>📍 <strong>Ubicación:</strong> {log.ubicacion}</div>}
                  {log.categoriaId && <div>📂 <strong>Categoría:</strong> #{log.categoriaId}</div>}
                  {log.tiempoEnPantalla && <div>⏱️ <strong>Tiempo:</strong> {log.tiempoEnPantalla}s</div>}
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
