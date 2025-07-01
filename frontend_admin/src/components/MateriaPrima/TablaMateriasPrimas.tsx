import { For, Show } from "solid-js";
import type { MateriaPrima } from '@/types/materiaPrima';
import ConPermiso from '@/components/Layout/ConPermiso';
import { formatearMiles, formatearPrecio } from "@/utils/formato";

export default function TablaMateriasPrimas(props: {
  materiasPrimas: MateriaPrima[];
  orden: string;
  direccion: "asc" | "desc";
  esVendedor: boolean;
  onOrdenar: (col: string) => void;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            {["sku", "nombre","costoDux", "stock", "valorizado"].map((col) => (
              <th
                class="text-left p-3 border-b cursor-pointer"
                onClick={() => props.onOrdenar(col)}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)} {props.orden === col && (props.direccion === "asc" ? "▲" : "▼")}
              </th>
            ))}
            <th class="text-left p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.materiasPrimas.length > 0}
            fallback={
              <tr>
                <td colspan="5" class="text-center p-4 text-gray-500">
                  No se encontraron materias primas
                </td>
              </tr>
            }
          >
            <For each={props.materiasPrimas}>
              {(p) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td class="p-3">{p.sku}</td>
                  <td class="p-3">{p.nombre}</td>
                  <td class="p-3">{formatearPrecio(p.costoDux)}</td>
                  <td class="p-3">{formatearMiles(p.stock)}</td>
                  <td class="p-3">{formatearPrecio(p.costoDux * p.stock)}</td>
                  <td class="p-3 flex gap-2">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onVer(p.id)}
                    >
                      Ver
                    </button>
                    <ConPermiso modulo="materias_primas" accion="editar">
                      <button
                        class="text-green-600 hover:underline"
                        onClick={() => props.onEditar(p.id)}
                      >
                        Editar
                      </button>
                    </ConPermiso>
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
