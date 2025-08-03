import { For, Show } from 'solid-js';
import type { Pieza } from '@/types/pieza';
import ConPermiso from '@/components/Layout/ConPermiso';

export default function TablaPiezas(props: {
  piezas: Pieza[];
  orden: string;
  direccion: 'asc' | 'desc';
  onOrdenar: (col: string) => void;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
  onEliminar: (id: number) => void;
}) {
  const thStyle = "px-3 py-2 cursor-pointer select-none whitespace-nowrap font-semibold text-sm border-b";
  const activeStyle = (col: string) =>
    props.orden === col ? " underline text-primary" : "";

  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse hidden md:table">
        <thead class="bg-gray-100 sticky top-0">
          <tr class="bg-gray-100">
            <th class={thStyle + activeStyle('codigo')}
              onClick={() => props.onOrdenar('codigo')}
            >Código {props.orden === 'codigo' ? (props.direccion === 'asc' ? '▲' : '▼') : ''}</th>
            <th class={thStyle + activeStyle('descripcion')}
              onClick={() => props.onOrdenar('descripcion')}
            >Descripción {props.orden === 'descripcion' ? (props.direccion === 'asc' ? '▲' : '▼') : ''}</th>
            <th class={thStyle + activeStyle('categoria')}
              onClick={() => props.onOrdenar('categoria')}
            >Categoría</th>
            <th class={thStyle}>Material</th>
            <th class={thStyle}>Rubro</th>
            <th class={thStyle}>Cavidades</th>
            <th class={thStyle}>Pzs/Seg</th>
            <th class={thStyle}>Ciclo/Seg</th>
            <th class={thStyle}>Peso(g)</th>
            <th class={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show when={props.piezas.length > 0} fallback={
            <tr>
              <td colSpan={10} class="py-6 text-center text-gray-500">No hay piezas para mostrar.</td>
            </tr>
          }>
            <For each={props.piezas}>
              {(p) => (
                <tr class="border-b hover:bg-gray-50 transition">
                  <td class="px-3 py-2">{p.codigo}</td>
                  <td class="px-3 py-2">{p.descripcion || '-'}</td>
                  <td class="px-3 py-2">{p.categoriaPieza?.nombre || '-'}</td>
                  <td class="px-3 py-2">{p.materialObj ? `${p.materialObj.codigo} - ${p.materialObj.descripcion}` : '-'}</td>
                  <td class="px-3 py-2">{p.rubro?.nombre || '-'}</td>
                  <td class="px-3 py-2 text-center">{p.cavidades ?? '-'}</td>
                  <td class="px-3 py-2 text-center">{p.pzsXSeg ?? '-'}</td>
                  <td class="px-3 py-2 text-center">{p.cicloXSeg ?? '-'}</td>
                  <td class="px-3 py-2 text-center">{p.peso ?? '-'}</td>
                  <td class="p-3 flex gap-2">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onVer(p.id)}
                    >
                      Ver
                    </button>
                    <ConPermiso modulo="productos" accion="editar">
                      <button
                        class="text-green-600 hover:underline"
                        onClick={() => props.onEditar(p.id)}
                      >
                        Editar
                      </button>
                    </ConPermiso>
                    <ConPermiso modulo="productos" accion="eliminar">
                      <button
                        class="text-red-600 hover:underline"
                        onClick={() => props.onEliminar(p.id)}
                      >
                        Eliminar
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
