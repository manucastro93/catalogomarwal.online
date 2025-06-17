import { For, Show } from "solid-js";
import { formatearMiles } from "@/utils/formato";
import { ProductoPendiente } from "@/types/producto";

export default function TablaProductosPendientes(props: {
    productos: ProductoPendiente[];
    orden: string;
    direccion: "asc" | "desc";
    onOrdenar: (col: keyof ProductoPendiente) => void;
    onVerProducto?: (codItem: string) => void;
}) {
    return (
        <div class="overflow-auto border rounded-lg">
            <table class="w-full text-sm border-collapse">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        {(["cod_item", "descripcion", "cantidad_pedida", "cantidad_facturada", "cantidad_pendiente", "stock"] as (keyof ProductoPendiente)[]).map((col) => (
                            <th
                                class="text-left p-3 border-b cursor-pointer whitespace-nowrap"
                                onClick={() => props.onOrdenar(col)}
                            >
                                {col.replaceAll("_", " ").replace(/\b\w/g, l => l.toUpperCase())}{" "}
                                {props.orden === col && (props.direccion === "asc" ? "▲" : "▼")}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <Show
                        when={props.productos.length > 0}
                        fallback={
                            <tr>
                                <td colspan="5" class="text-center p-4 text-gray-500">
                                    No hay productos pendientes de facturación
                                </td>
                            </tr>
                        }
                    >
                        <For each={props.productos}>
                            {(p) => (
                                <tr
                                    class="border-b hover:bg-blue-50 cursor-pointer"
                                    onClick={() => props.onVerProducto?.(p.codItem)}
                                >
                                    <td class="p-3 font-mono">{p.codItem}</td>
                                    <td class="p-3">{p.descripcion}</td>
                                    <td class="p-3">{formatearMiles(p.cantidad_pedida)}</td>
                                    <td class="p-3">{formatearMiles(p.cantidad_facturada)}</td>
                                    <td class="p-3 font-bold text-red-600">{formatearMiles(p.cantidad_pendiente)}</td>
                                    <td class="p-3">{formatearMiles(p.stock)}</td>
                                </tr>
                            )}
                        </For>

                    </Show>
                </tbody>
            </table>
        </div>
    );
}
