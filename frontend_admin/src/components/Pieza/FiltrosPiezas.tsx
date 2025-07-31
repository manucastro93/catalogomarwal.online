import type { CategoriaPieza } from '@/types/categoriaPieza';
import type { Material } from '@/types/material';
import type { Rubro } from '@/types/rubro';

export default function FiltrosPiezas(props: {
  busqueda: string;
  categoriaSeleccionada: string;
  categorias: CategoriaPieza[];
  materialSeleccionado: string;
  materiales: Material[];
  rubroSeleccionado: string;
  rubros: Rubro[];
  onBuscar: (valor: string) => void;
  onSeleccionCategoria: (valor: string) => void;
  onSeleccionMaterial: (valor: string) => void;
  onSeleccionRubro: (valor: string) => void;
}) {
  return (
    <div class="mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Buscar</label>
        <input
          type="text"
          value={props.busqueda}
          onInput={(e) => props.onBuscar((e.target as HTMLInputElement).value)}
          placeholder="Buscar código o descripción..."
          class="border rounded px-3 py-2 w-48"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
        <select
          class="border rounded px-3 py-2 w-48"
          value={props.categoriaSeleccionada}
          onChange={e => props.onSeleccionCategoria((e.target as HTMLSelectElement).value)}
        >
          <option value="">Todas</option>
          {props.categorias.map(c => (
            <option value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Material</label>
        <select
          class="border rounded px-3 py-2 w-48"
          value={props.materialSeleccionado}
          onChange={e => props.onSeleccionMaterial((e.target as HTMLSelectElement).value)}
        >
          <option value="">Todos</option>
          {props.materiales.map(m => (
            <option value={m.id}>{m.codigo} - {m.descripcion}</option>
          ))}
        </select>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Rubro</label>
        <select
          class="border rounded px-3 py-2 w-48"
          value={props.rubroSeleccionado}
          onChange={e => props.onSeleccionRubro((e.target as HTMLSelectElement).value)}
        >
          <option value="">Todos</option>
          {props.rubros.map(r => (
            <option value={r.id}>{r.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
