import {
    createSignal,
    For,
    Show,
    createMemo,
    createEffect,
  } from "solid-js";
  import { formatearPrecio } from "@/utils/formato";
  import type { Pedido } from "@/types/pedido";
  import { Eye, ArrowDownAZ, ArrowDownUp, ArrowUpDown } from "lucide-solid";
  import { useNavigate } from "@solidjs/router";
  import VerPedidoModal from "@/components/Pedido/VerPedidoModal";
  import { obtenerPedidoPorId } from "@/services/pedido.service"

  export default function ListaPedidos(props: {
    titulo: string;
    pedidos: Pedido[];
    color?: string;
  }) {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = createSignal("");
    const [orden, setOrden] = createSignal<"fecha" | "total">("fecha");
    const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<Pedido | null>(null);
    const pedidosFiltrados = createMemo(() => {
      const b = busqueda().toLowerCase();
      return props.pedidos.filter((p) =>
        p.cliente?.nombre?.toLowerCase().includes(b)
      );
    });
  
    const pedidosOrdenados = createMemo(() => {
      const lista = [...pedidosFiltrados()];
      if (orden() === "fecha") {
        return lista.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        return lista.sort((a, b) => b.total - a.total);
      }
    });
  
    return (
      <div class="bg-white shadow-lg rounded-xl p-4 border border-gray-200">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
          <h2 class="text-lg font-bold text-gray-800">{props.titulo}</h2>
  
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="Buscar cliente..."
              class="text-sm px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
              onInput={(e) => setBusqueda(e.currentTarget.value)}
            />
            <select
              class="text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
              value={orden()}
              onChange={(e) => setOrden(e.currentTarget.value as "fecha" | "total")}
            >
              <option value="fecha">📅 Fecha</option>
              <option value="total">💰 Total</option>
            </select>
          </div>
        </div>
  
        <ul class="space-y-3">
          <For each={pedidosOrdenados()}>
            {(pedido) => (
              <li
                class={`flex justify-between items-center border-l-4 ${
                  props.color ?? "border-gray-300"
                } bg-gray-50 rounded px-4 py-3`}
              >
                <div>
                  <div class="font-semibold text-gray-700">{pedido.cliente?.nombre}</div>
                  <div class="text-sm text-gray-500">
                    Total: {formatearPrecio(pedido.total)} · {pedido.createdAt.slice(0, 10)}
                  </div>
                </div>
                <button
  onClick={async () => {
    const pedidoCompleto = await obtenerPedidoPorId(pedido.id);
    setPedidoSeleccionado(pedidoCompleto);
  }}
  class="flex items-center gap-1 text-sm text-blue-600 hover:underline"
>
  <Eye size={16} />
  Ver
</button>

              </li>
            )}
          </For>
  
          <Show when={pedidosOrdenados().length === 0}>
            <li class="text-sm text-gray-400 italic">No hay coincidencias.</li>
          </Show>
        </ul>
        <VerPedidoModal
          pedido={pedidoSeleccionado()}
          onClose={() => setPedidoSeleccionado(null)}
        />
      </div>
    );
  }
  