import { createSignal, createResource, For, Show } from "solid-js";
import { obtenerEstadisticasCliente } from "../../../services/estadisticas.service";
import { obtenerPedidoPorId } from "../../../services/pedido.service";
import { formatearPrecio } from "../../../utils/formato";
import VerPedidoModal from "../../Pedido/VerPedidoModal";

export default function TabEstadisticasCliente(props: { clienteId: number }) {
  const [datos] = createResource(() =>
    obtenerEstadisticasCliente(props.clienteId)
  );
  const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<
    number | null
  >(null);
  const [pedidoCompleto] = createResource(
    pedidoSeleccionado,
    obtenerPedidoPorId
  );

  return (
    <>
      <Show
        when={!datos.loading}
        fallback={<p class="text-sm text-gray-500">Cargando estadísticas...</p>}
      >
        <div class="space-y-6">
          <div>
            <h3 class="font-semibold text-base mb-1">🛒 Últimos pedidos</h3>
            <Show
              when={datos().pedidos.length > 0}
              fallback={
                <p class="text-sm text-gray-600">
                  Este cliente no tiene pedidos.
                </p>
              }
            >
              <ul class="text-sm list-disc ml-5">
                <For each={datos().pedidos}>
                  {(p) => (
                    <li
                      class="cursor-pointer hover:underline text-blue-600"
                      onClick={() => setPedidoSeleccionado(p.id)}
                    >
                      Pedido #{p.id} — {formatearPrecio(p.total)} —{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>

          <div>
            <h3 class="font-semibold text-base mb-1">
              🏆 Productos más comprados
            </h3>
            <Show
              when={datos().productosTop.length > 0}
              fallback={
                <p class="text-sm text-gray-600">Aún no compró productos.</p>
              }
            >
              <ul class="text-sm list-disc ml-5">
                <For each={datos().productosTop}>
                  {(item) => (
                    <li>
                      {item.producto?.nombre || "—"} — {item.totalComprado}{" "}
                      unidades — {formatearPrecio(item.totalGastado)}
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>

          <div>
            <h3 class="font-semibold text-base mb-1">📄 Últimos logs</h3>
            <Show
              when={datos().logs.length > 0}
              fallback={
                <p class="text-sm text-gray-600">
                  No hay actividad registrada.
                </p>
              }
            >
              <ul class="text-sm list-disc ml-5">
                <For each={datos().logs}>
                  {(log) => (
                    <li>
                      [{new Date(log.createdAt).toLocaleString()}]{" "}
                      <strong>{log.ubicacion}</strong>
                      {log.busqueda ? ` — ${log.busqueda}` : ""}
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={pedidoSeleccionado() != null}>
        <VerPedidoModal
          pedido={pedidoCompleto() ?? null}
          onClose={() => setPedidoSeleccionado(null)}
        />
      </Show>
    </>
  );
}
