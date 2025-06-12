import { For, Show } from "solid-js";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";
import type { PedidoDux } from "@/types/pedido";

export default function TablaPedidosDux(props: {
  pedidos: PedidoDux[];
  orden: string;
  direccion: "asc" | "desc";
  onOrdenar: (col: string) => void;
  onVer: (p: PedidoDux) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-yellow-100 sticky top-0">
          <tr>
            {["fecha", "nro_pedido", "cliente", "estado", "total", "vendedor"].map((col) => (
              <th
                class="text-left p-3 border-b cursor-pointer"
                onClick={() => props.onOrdenar(col)}
              >
                {col === 'nro_pedido' ? 'Pedido Nro' : col.charAt(0).toUpperCase() + col.slice(1)}{" "}
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
                <td colspan="7" class="text-center p-4 text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            }
          >
            <For each={props.pedidos}>
              {(p) => (
                <tr class="bg-yellow-50 text-gray-800 border-b">
                  <td class="p-3">{formatearFechaCorta(p.fecha)}</td>
                  <td class="p-3">{p.nro_pedido}</td>
                  <td class="p-3">{p.cliente}</td>
                  <td class="p-3">{p.estado_facturacion}</td>
                  <td class="p-3">{formatearPrecio(Number(p.total))}</td>
                  <td class="p-3">
                    {p.nombre_vendedor
                      ? `${p.nombre_vendedor} ${p.apellido_vendedor ?? ""}`
                      : "—"}
                  </td>
                  <td class="p-3">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onVer(p)}
                    >
                      Ver
                    </button>
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