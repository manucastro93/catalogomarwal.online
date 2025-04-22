import { For, Show } from "solid-js";
import { formatearPrecio } from "../../utils/formato";
import type { Pedido } from "../../types/pedido";

export default function TablaPedidos(props: {
  pedidos: Pedido[];
  orden: string;
  direccion: "asc" | "desc";
  onOrdenar: (col: string) => void;
  onVer: (p: Pedido) => void;
  onCambiarEstado: (p: Pedido) => void;
  esVendedor: boolean;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            {["id", "cliente", "vendedor", "estado", "total", "createdAt"].map((col) => (
              <th
                class="text-left p-3 border-b cursor-pointer"
                onClick={() => props.onOrdenar(col)}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}{" "}
                {props.orden === col && (props.direccion === "asc" ? "▲" : "▼")}
              </th>
            ))}
            <th class="text-left p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.pedidos.length > 0}
            fallback={
              <tr>
                <td colspan="8" class="text-center p-4 text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            }
          >
            <For each={props.pedidos}>
              {(p) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td class="p-3">{p.id}</td>
                  <td class="p-3">{p.cliente?.nombre || "—"}</td>
                  <td class="p-3">{p.usuario?.nombre || "—"}</td>
                  <td class="p-3">{p.estado}</td>
                  <td class="p-3">{formatearPrecio(p.total)}</td>
                  <td class="p-3">{new Date(p.createdAt).toLocaleString()}</td>
                  <td class="p-3 flex gap-2">
                    <button class="text-blue-600 hover:underline" onClick={() => props.onVer(p)}>
                      Ver
                    </button>
                    <Show
  when={!props.esVendedor}
  fallback={
    <Show when={p.estadoEdicion === "editando"}>
      <span class="text-sm text-yellow-600 font-semibold">🛠 En edición</span>
    </Show>
  }
>
  <Show when={p.estadoEdicion !== "editando"} fallback={
    <span class="text-sm text-yellow-600 font-semibold">🛠 En edición</span>
  }>
    <button
      class="text-yellow-600 hover:underline"
      onClick={() => props.onCambiarEstado(p)}
    >
      Cambiar estado
    </button>
  </Show>
</Show>

                  </td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
