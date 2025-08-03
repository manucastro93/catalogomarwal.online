import { For } from 'solid-js';
import ConPermiso from '@/components/Layout/ConPermiso';
import type { Operario } from '@/types/operario';

export default function TablaOperarios(props: {
  operarios: Operario[];
  orden: string;
  direccion: string;
  onOrdenar: (col: string) => void;
  onVer: (op: Operario) => void;
  onEditar: (op: Operario) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th  class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('codigo')}>Código</th>
            <th  class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('nombre')}>Nombre</th>
            <th  class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('apellido')}>Apellido</th>
            <th  class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('rubroId')}>Rubro</th>
            <th class="text-right p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody >
          <For each={props.operarios}>
            {operario => (
              <tr class="hover:bg-gray-50 border-b">
                <td class="p-3">{operario.codigo}</td>
                <td class="p-3">{operario.nombre}</td>
                <td class="p-3">{operario.apellido}</td>
                <td class="p-3">{operario.rubro?.nombre || '-'}</td>
                <td class="p-3 flex gap-2 justify-end">
                  <button class="text-blue-600 hover:underline" onClick={() => props.onVer(operario)}>
                    Ver
                  </button>
                  <ConPermiso modulo="Operarios" accion="editar">
                    <button class="text-yellow-600 hover:underline" onClick={() => props.onEditar(operario)}>
                      Editar
                    </button>
                  </ConPermiso>
                  <ConPermiso modulo="Operarios" accion="eliminar">
                    <button class="text-red-600 hover:underline" onClick={() => props.onEliminar(operario.id)}>
                      Eliminar
                    </button>
                  </ConPermiso>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      {props.operarios.length === 0 && (
        <div class="text-gray-500 text-center py-8">No hay operarios.</div>
      )}
    </div>
  );
}
