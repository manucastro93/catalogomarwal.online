import { createResource, Show, For, createEffect } from "solid-js";
import { formatearMiles } from "@/utils/formato";
import { fetchDetallePorPedido } from "@/services/eficiencia.service";

interface Props {
  pedidoId: number;
  abierto: boolean;
  onCerrar: () => void;
}


export default function ModalDetallePedido({ pedidoId, abierto, onCerrar }: Props) {
  const [detalle] = createResource(pedidoId, fetchDetallePorPedido);
createEffect(() => {
  if (detalle.state === "ready") {
    console.log("🔎 Detalle pedido:", detalle());
  }
});
  return (
    <Show when={abierto}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 md:mx-8">
          <div class="flex justify-between items-center px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Detalle de pedido #{pedidoId}</h2>
            <button class="text-gray-600 hover:text-gray-900 text-xl" onClick={onCerrar}>
              &times;
            </button>
          </div>

          <div class="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Show when={!detalle.loading && detalle()}>
              <table class="min-w-full text-sm text-left">
                <thead class="bg-gray-100 text-xs uppercase text-gray-600 sticky top-0">
                  <tr>
                    <th class="px-4 py-2">Código</th>
                    <th class="px-4 py-2">Descripción</th>
                    <th class="px-4 py-2">Cant. Pedida</th>
                    <th class="px-4 py-2">Cant. Facturada</th>
                    <th class="px-4 py-2">Fill Rate</th>
                    <th class="px-4 py-2">Lead Time (días)</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={detalle()}>
                    {(item) => (
                      <tr class="border-t hover:bg-gray-50">
                        <td class="px-4 py-2">{item.codItem ?? "—"}</td>
                        <td class="px-4 py-2">{item.descripcion ?? "—"}</td>
                        <td class="px-4 py-2">{formatearMiles(item.pedida ?? 0)}</td>
                        <td class="px-4 py-2">{formatearMiles(item.facturada ?? 0)}</td>
                        <td class="px-4 py-2">
                          {item.fillRate !== undefined
                            ? `${item.fillRate.toFixed(2)}%`
                            : "—"}
                        </td>
                        <td class="px-4 py-2">
                          {item.leadTimeDias !== undefined && item.leadTimeDias !== null
                            ? item.leadTimeDias
                            : "—"}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
            <Show when={detalle.loading}>
              <div class="p-6 text-center text-gray-500">
                Cargando productos del pedido...
              </div>
            </Show>
          </div>

          <div class="p-4 text-right">
            <button
              onClick={onCerrar}
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
