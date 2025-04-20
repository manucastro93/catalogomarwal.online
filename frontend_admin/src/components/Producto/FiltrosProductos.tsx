import { For } from "solid-js";
import type { Categoria } from "../../types/categoria";

export default function FiltrosProductos(props: {
  busqueda: string;
  categoriaSeleccionada: string;
  categorias: Categoria[];
  onBuscar: (valor: string) => void;
  onSeleccionCategoria: (valor: string) => void;
}) {
  return (
    <div class="flex gap-4 mb-4">
      <input
        type="text"
        placeholder="Buscar por nombre..."
        class="p-2 border rounded w-full max-w-md"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />

      <select
        class="p-2 border rounded"
        value={props.categoriaSeleccionada}
        onInput={(e) => props.onSeleccionCategoria(e.currentTarget.value)}
      >
        <option value="">Todas las categorías</option>
        <For each={props.categorias}>
          {(cat) => <option value={String(cat.id)}>{cat.nombre}</option>}
        </For>
      </select>
    </div>
  );
}
