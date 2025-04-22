import { createSignal, createResource, For, Show } from "solid-js";
import dayjs from "dayjs";
import { obtenerLogsGenerales } from "../services/log.service";
import { formatearFechaHora } from "../utils/formato";
import type { LogCliente } from "../types/log";

// Parámetros para la consulta
interface LogsParams {
  clienteId?: string;
  desde?: string;
  hasta?: string;
  page: number;
  groupBy?: "ipFecha";
}

// Respuesta del backend
interface LogsResponse {
  data: LogCliente[];
  total: number;
  pagina: number;
  totalPaginas: number;
  grouped?: Record<string, LogCliente[]>;
}

// Extiende LogCliente para incluir relaciones anidadas
type ExtendedLog = LogCliente & {
  ipCliente?: { cliente?: { nombre: string }; ip: string };
  categoria?: { nombre: string };
};

export default function LogsCliente() {
  const [clienteId, setClienteId] = createSignal<string>("");
  const [desde, setDesde] = createSignal<string>("");
  const [hasta, setHasta] = createSignal<string>("");
  const [groupBy, setGroupBy] = createSignal<"none" | "ipFecha">("none");
  const [page, setPage] = createSignal<number>(1);
  const [expanded, setExpanded] = createSignal<Record<string, boolean>>({});

  // Fuente tipada para createResource
  const source = () => {
    const gb = groupBy() === "ipFecha" ? "ipFecha" : undefined;
    return {
      clienteId: clienteId() || undefined,
      desde: desde() || undefined,
      hasta: hasta() || undefined,
      page: page(),
      groupBy: gb,
    } as LogsParams;
  };

  // createResource<Data, Source>
  const [response, { refetch }] = createResource<LogsResponse, LogsParams>(
    source,
    obtenerLogsGenerales
  );

  const toggleGroup = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buscar = () => {
    setPage(1);
    refetch();
  };
  const prevPage = () => {
    if (page() > 1) {
      setPage(page() - 1);
      refetch();
    }
  };
  const nextPage = () => {
    if (response()?.totalPaginas && page() < response()!.totalPaginas) {
      setPage(page() + 1);
      refetch();
    }
  };

  return (
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Actividad de clientes (logs)</h2>

      {/* Filtros */}
      <div class="grid md:grid-cols-5 gap-3 mb-6">
        <input
          type="text"
          class="border p-2 rounded"
          placeholder="Cliente ID"
          value={clienteId()}
          onInput={(e) => setClienteId((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          class="border p-2 rounded"
          value={desde()}
          onInput={(e) => setDesde((e.target as HTMLInputElement).value)}
        />
        <input
          type="date"
          class="border p-2 rounded"
          value={hasta()}
          onInput={(e) => setHasta((e.target as HTMLInputElement).value)}
        />
        <select
          class="border p-2 rounded"
          value={groupBy()}
          onInput={(e) =>
            setGroupBy((e.target as HTMLSelectElement).value as any)
          }
        >
          <option value="none">Sin agrupar</option>
          <option value="ipFecha">Agrupar por fecha‑IP</option>
        </select>
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={buscar}
        >
          Buscar
        </button>
      </div>

      {/* Estados */}
      <Show when={response.loading}>
        <p>Cargando logs...</p>
      </Show>
      <Show when={!response.loading && response()?.data?.length === 0}>
        <p>No se encontraron logs.</p>
      </Show>

      {/* Agrupar por fecha‑IP */}
      <Show when={!response.loading && groupBy() === "ipFecha"}>
        <For
          each={Object.entries(
            response()!.grouped as Record<string, ExtendedLog[]>
          )}
        >
          {([key, logs]) => (
            <div class="mb-6 border rounded shadow-sm">
              <div
  class="bg-gray-100 px-4 py-2 font-semibold text-sm cursor-pointer border-b flex justify-between items-center"
  onClick={() => toggleGroup(key)}
>
  <span>{key} ({logs.length})</span>
  <span class="text-xs">
    {expanded()[key] ? '▼' : '▶'}
  </span>
</div>

              <Show when={expanded()[key]}>
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50 text-left border-b">
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
                    <For each={logs as ExtendedLog[]}>
                      {(log) => (
                        <tr class="border-t odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                          <td class="p-2">
                            {formatearFechaHora(log.createdAt)}
                          </td>
                          <td class="p-2">
                            {log.ipCliente?.clientes
                              ?.map((c) => c.nombre)
                              .join(", ") ||
                              log.ipCliente?.cliente?.nombre ||
                              "-"}
                          </td>
                          <td class="p-2">{log.ipCliente?.ip || "-"}</td>
                          <td class="p-2">{log.fuente || "-"}</td>
                          <td class="p-2">{log.busqueda || "-"}</td>
                          <td class="p-2">{log.categoria?.nombre || "-"}</td>
                          <td class="p-2">{log.ubicacion || "-"}</td>
                          <td class="p-2">{log.tiempoEnPantalla || 0}s</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </Show>
            </div>
          )}
        </For>
      </Show>

      {/* Vista paginada estándar */}
      <Show when={!response.loading && groupBy() === "none"}>
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
            <For each={response()!.data as ExtendedLog[]}>
              {(log) => (
                <tr class="border-t odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <td class="p-2">{formatearFechaHora(log.createdAt)}</td>
                  <td class="p-2">{log.ipCliente?.cliente?.nombre || "-"}</td>
                  <td class="p-2">{log.ipCliente?.ip || "-"}</td>
                  <td class="p-2">{log.fuente}</td>
                  <td class="p-2">{log.busqueda || "-"}</td>
                  <td class="p-2">{log.categoria?.nombre || "-"}</td>
                  <td class="p-2">{log.ubicacion || "-"}</td>
                  <td class="p-2">{log.tiempoEnPantalla || 0}s</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <div class="flex items-center justify-between mt-4">
          <button
            class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={prevPage}
            disabled={page() <= 1}
          >
            Anterior
          </button>
          <span>
            Página {page()} de {response()!.totalPaginas}
          </span>
          <button
            class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            onClick={nextPage}
            disabled={page() >= response()!.totalPaginas}
          >
            Siguiente
          </button>
        </div>
      </Show>
    </div>
  );
}
