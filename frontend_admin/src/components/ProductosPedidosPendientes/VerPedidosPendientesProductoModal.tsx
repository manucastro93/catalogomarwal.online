import { For, Show, createResource } from "solid-js";
import { formatearFechaCorta, formatearMiles } from "@/utils/formato";
import { obtenerPedidosPendientesPorProducto } from "@/services/pedido.service";

interface Props {
  codItem: string;
  abierto: boolean;
  desde?: string;
  hasta?: string;
  onCerrar: () => void;
}

export default function VerPedidosPendientesProductoModal({ codItem, abierto, desde, hasta, onCerrar }: Props) {
  const [data] = createResource(
    () => (abierto ? { codItem, desde, hasta } : null),
    async ({ codItem, desde, hasta }) => {
      return await obtenerPedidosPendientesPorProducto(codItem, { desde, hasta });
    }
  );

  return (
    <Show when={abierto}>
    <div class="fixed inset-0 bg-black/40 z-50 flex justify-center items-start pt-20 px-4">
  <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-auto">
    <div class="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
      <h2 class="text-lg md:text-xl font-semibold text-gray-800">
        Pedidos pendientes para <code class="font-mono text-blue-700">{codItem}</code>
      </h2>
      <button
        class="text-sm text-gray-600 hover:text-red-600 transition"
        onClick={onCerrar}
      >
        ✕ Cerrar
      </button>
    </div>

    <div class="p-4">
      <Show when={!data.loading} fallback={<p class="text-sm text-gray-500">Cargando...</p>}>
        <Show when={(data() ?? []).length > 0} fallback={<p class="text-sm text-gray-500">No hay pedidos pendientes para este producto.</p>}>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-50 sticky top-0 z-10 text-gray-700">
                <tr class="text-left border-b border-gray-200">
                  <th class="px-3 py-2">Pedido</th>
                  <th class="px-3 py-2">Cliente</th>
                  <th class="px-3 py-2">Fecha</th>
                  <th class="px-3 py-2 text-right">Pedida</th>
                  <th class="px-3 py-2 text-right">Facturada</th>
                  <th class="px-3 py-2 text-right text-red-600">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                <For each={data()}>
                  {(p) => (
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                      <td class="px-3 py-2 font-mono">{p.nro_pedido}</td>
                      <td class="px-3 py-2">{p.cliente}</td>
                      <td class="px-3 py-2">{formatearFechaCorta(p.fecha)}</td>
                      <td class="px-3 py-2 text-right">{formatearMiles(p.cantidad_pedida)}</td>
                      <td class="px-3 py-2 text-right">{formatearMiles(p.cantidad_facturada)}</td>
                      <td class="px-3 py-2 text-right font-semibold text-red-600">{formatearMiles(p.cantidad_pendiente)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  </div>
</div>

    </Show>
  );
}
