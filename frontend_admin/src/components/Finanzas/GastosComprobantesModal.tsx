import { createResource, Show, For } from "solid-js";
import { obtenerGastosDetalle } from "@/services/finanzas.service";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";
import type { YearKey, GastoDetalle } from "@/types/finanzas";

const monthIndex = (k: YearKey) =>
  ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"].indexOf(k) + 1;

export default function GastosComprobantesModal(props: {
  anio: number;
  monthKey: YearKey;
  categoriaId?: number;
  proveedorId?: number;
  titulo: string;
  onClose: () => void;
}) {
  const mes = monthIndex(props.monthKey);

  const [lista] = createResource(
    () => ({ anio: props.anio, mes, categoriaId: props.categoriaId, proveedorId: props.proveedorId }),
    obtenerGastosDetalle
  );

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-xxl max-h-[95vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">{props.titulo}</h3>
          <button class="px-3 py-1 rounded bg-gray-200" onClick={props.onClose}>Cerrar</button>
        </div>

        <div class="p-4 overflow-auto">
          <Show when={lista()} fallback={<div class="text-sm text-muted-foreground">Cargando…</div>}>
            <table class="w-full text-sm border rounded overflow-hidden">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-3 py-2">Fecha</th>
                  <th class="text-left px-3 py-2">Proveedor</th>
                  <th class="text-left px-3 py-2">Categoría</th>
                  <th class="text-left px-3 py-2">Comprobante</th>
                  <th class="text-left px-3 py-2">Tipo</th>
                  <th class="text-right px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <For each={lista() as GastoDetalle[]}>
                  {(g) => (
                    <tr class="border-b hover:bg-muted/20">
                      <td class="px-3 py-2">{formatearFechaCorta(g.fecha)}</td>
                      <td class="px-3 py-2">{g.proveedorNombre}</td>
                      <td class="px-3 py-2">{g.categoriaNombre}</td>
                      <td class="px-3 py-2">{g.comprobante ?? "-"}</td>
                      <td class="px-3 py-2">{g.tipoComprobante ?? "-"}</td>
                      <td class="px-3 py-2 text-right">{formatearPrecio(g.total)}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </div>
    </div>
  );
}
