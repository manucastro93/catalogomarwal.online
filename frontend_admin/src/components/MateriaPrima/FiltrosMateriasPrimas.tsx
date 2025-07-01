import { For } from "solid-js";
import type { Subcategoria } from "@/types/categoria";

export default function FiltrosMateriasPrimas(props: {
  busqueda: string;
  subcategoriaSeleccionada: string;
  subcategorias: Subcategoria[];
  onBuscar: (valor: string) => void;
  onSeleccionSubcategoria: (valor: string) => void;
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
        value={props.subcategoriaSeleccionada}
        onInput={(e) => props.onSeleccionSubcategoria(e.currentTarget.value)}
      >
        <option value="">Todas las Subcategorías</option>
        <For each={props.subcategorias}>
          {(cat) => <option value={String(cat.id)}>{cat.nombre}</option>}
        </For>
      </select>
    </div>
  );
}
