import { For, Show } from "solid-js";
import type { ClienteDux } from "@/types/clienteDux";
import { formatearFechaCorta } from "@/utils/formato";

export default function TablaClientes(props: {
  clientes: ClienteDux[];
  pagina: number;
  totalPaginas: number;
  onPaginaChange: (nueva: number) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg mt-6">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th class="text-left p-3 border-b">Fecha</th>
            <th class="text-left p-3 border-b">Cliente</th>
            <th class="text-left p-3 border-b">CUIT</th>
            <th class="text-left p-3 border-b">Lista de Precio</th>
            <th class="text-left p-3 border-b">Vendedor</th>
            <th class="text-left p-3 border-b">Provincia</th>
            <th class="text-left p-3 border-b">Localidad</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.clientes.length}
            fallback={
              <tr>
                <td colspan="7" class="text-center p-4 text-gray-500">
                  No se encontraron clientes
                </td>
              </tr>
            }
          >
            <For each={props.clientes}>
              {(c) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td class="p-3">{formatearFechaCorta(c.fechaCreacion!)}</td>
                  <td class="p-3">{c.cliente}</td>
                  <td class="p-3">{c.cuitCuil}</td>
                  <td class="p-3">{c.listaPrecioPorDefecto}</td>
                  <td class="p-3">{c.vendedor}</td>
                  <td class="p-3">{c.provincia}</td>
                  <td class="p-3">{c.localidad}</td>
                </tr>
              )}
            </For>
            </Show>
        </tbody>
      </table>

      {/* Paginación */}
      <div class="flex justify-end items-center gap-2 p-4">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => props.onPaginaChange(props.pagina - 1)}
          disabled={props.pagina <= 1}
        >
          Anterior
        </button>
        <span class="text-sm">
          Página {props.pagina} de {props.totalPaginas}
        </span>
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => props.onPaginaChange(props.pagina + 1)}
          disabled={props.pagina >= props.totalPaginas}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
