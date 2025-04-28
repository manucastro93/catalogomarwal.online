import { For, Show } from "solid-js";
import type { Categoria } from "@/types/categoria";

export default function TablaCategorias(props: {
  categorias: Categoria[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onEditar: (c: Categoria) => void;
  onEliminar: (c: Categoria) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="text-left p-3 border-b">Nombre</th>
            <th class="text-left p-3 border-b">Orden</th>
            <th class="text-left p-3 border-b">Estado</th>
            <th class="text-left p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.categorias.length > 0}
            fallback={
              <tr>
                <td colspan="4" class="text-center p-4 text-gray-500">
                  No hay categorías
                </td>
              </tr>
            }
          >
            <For each={props.categorias}>
              {(c) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td class="p-3">{c.nombre}</td>
                  <td class="p-3">{c.orden ?? "-"}</td>
                  <td class="p-3">{c.estado ? "Activa" : "Inactiva"}</td>
                  <td class="p-3 flex gap-2">
                    <Show when={props.puedeEditar}>
                      <button
                        class="text-green-600 hover:underline"
                        onClick={() => props.onEditar(c)}
                      >
                        Editar
                      </button>
                    </Show>
                    <Show when={props.puedeEliminar}>
                      <button
                        class="text-red-600 hover:underline"
                        onClick={() => props.onEliminar(c)}
                      >
                        Eliminar
                      </button>
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
