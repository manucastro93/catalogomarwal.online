import { For } from "solid-js";
import type { Categoria } from "@/types/categoria";

interface Props {
  textoProducto: string;
  categoriaId: number | undefined;
  desde: string;
  hasta: string;
  categorias: Categoria[];

  onBuscarTexto: (texto: string) => void;
  onCategoriaSeleccionada: (id: number | undefined) => void;
  onFechaDesdeSeleccionada: (fecha: string) => void;
  onFechaHastaSeleccionada: (fecha: string) => void;
}

export default function FiltrosProductosPendientes(props: Props) {
  return (
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar producto por código, nombre o descripción"
        class="p-2 border rounded w-full max-w-md"
        value={props.textoProducto}
        onInput={(e) => props.onBuscarTexto(e.currentTarget.value)}
      />

      <select
        class="p-2 border rounded"
        value={props.categoriaId ?? ""}
        onChange={(e) =>
          props.onCategoriaSeleccionada(
            e.currentTarget.value ? Number(e.currentTarget.value) : undefined
          )
        }
      >
        <option value="">Todas las categorías</option>
        <For each={props.categorias}>
          {(c) => (
            <option value={c.id}>{c.nombre}</option>
          )}
        </For>
      </select>

      <div>
        <label class="block text-xs text-gray-600">Desde</label>
        <input
          type="date"
          class="p-2 border rounded"
          value={props.desde}
          onChange={(e) => props.onFechaDesdeSeleccionada(e.currentTarget.value)}
        />
      </div>

      <div>
        <label class="block text-xs text-gray-600">Hasta</label>
        <input
          type="date"
          class="p-2 border rounded"
          value={props.hasta}
          onChange={(e) => props.onFechaHastaSeleccionada(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
