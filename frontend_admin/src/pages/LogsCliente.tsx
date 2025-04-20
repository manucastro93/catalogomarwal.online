import { createSignal, createResource, For, Show } from 'solid-js';
import { obtenerLogsGenerales } from '../services/log.service';
import { formatearFechaHora } from '../utils/formato';

export default function LogsCliente() {
  const [clienteId, setClienteId] = createSignal('');
  const [ip, setIp] = createSignal('');
  const [desde, setDesde] = createSignal('');
  const [hasta, setHasta] = createSignal('');
  const [page, setPage] = createSignal(1);

  const [logs, { refetch }] = createResource(
    () => ({
      clienteId: clienteId() || undefined,
      ip: ip() || undefined,
      desde: desde() || undefined,
      hasta: hasta() || undefined,
      page: page(),
    }),
    obtenerLogsGenerales
  );

  const buscar = () => {
    setPage(1);
    refetch();
  };

  return (
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Actividad de clientes (logs)</h2>

      <div class="grid md:grid-cols-5 gap-3 mb-6">
        <input
          type="text"
          class="border p-2 rounded"
          placeholder="Cliente ID"
          value={clienteId()}
          onInput={(e: Event) => setClienteId((e.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          class="border p-2 rounded"
          placeholder="IP"
          value={ip()}
          onInput={(e: Event) => setIp((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          class="border p-2 rounded"
          value={desde()}
          onInput={(e: Event) => setDesde((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          class="border p-2 rounded"
          value={hasta()}
          onInput={(e: Event) => setHasta((e.target as HTMLInputElement).value)}
        />
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={buscar}
        >
          Buscar
        </button>
      </div>

      <Show when={logs.loading}>
        <p>Cargando logs...</p>
      </Show>

      <Show when={logs()?.data?.length === 0}>
        <p>No se encontraron logs.</p>
      </Show>

      <Show when={logs()?.data?.length}>
        <table class="w-full text-sm border border-gray-300 rounded">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="p-2">Fecha</th>
              <th class="p-2">Cliente</th>
              <th class="p-2">IP</th>
              <th class="p-2">Fuente</th>
              <th class="p-2">Búsqueda</th>
              <th class="p-2">Categoría</th>
              <th class="p-2">Ubicación</th>
              <th class="p-2">Tiempo</th>
            </tr>
          </thead>
          <tbody>
            <For each={logs()?.data}>
              {(log) => (
                <tr class="border-t">
                  <td class="p-2">{formatearFechaHora(log.createdAt)}</td>
                  <td class="p-2">{log.ipCliente?.cliente?.nombre || '-'}</td>
                  <td class="p-2">{log.ipCliente?.ip}</td>
                  <td class="p-2">{log.fuente}</td>
                  <td class="p-2">{log.busqueda || '-'}</td>
                  <td class="p-2">{log.categoriaId || '-'}</td>
                  <td class="p-2">{log.ubicacion || '-'}</td>
                  <td class="p-2">{log.tiempoEnPantalla || 0}s</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
