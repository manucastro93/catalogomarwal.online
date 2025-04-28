import { createSignal, createMemo, For, Show } from 'solid-js';
import type { Usuario } from '@/types/usuario';

interface Props {
  operarios: Usuario[];
  orden: string;
  direccion: 'asc' | 'desc';
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onOrdenar: (col: string) => void;
  onVer: (operario: Usuario) => void;
  onEditar: (operario: Usuario) => void;
  onEliminar: (id: number) => void;
}

export default function TablaOperarios(props: Props) {
  const ordenar = (col: string) => props.onOrdenar(col);

  const operariosOrdenados = createMemo(() => {
    return [...props.operarios].sort((a, b) => {
      const valA = (a as any)[props.orden] || '';
      const valB = (b as any)[props.orden] || '';
      if (valA < valB) return props.direccion === 'asc' ? -1 : 1;
      if (valA > valB) return props.direccion === 'asc' ? 1 : -1;
      return 0;
    });
  });

  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th class="p-2 cursor-pointer" onClick={() => ordenar('nombre')}>Nombre</th>
            <th class="p-2 cursor-pointer" onClick={() => ordenar('email')}>Email</th>
            <th class="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <For each={operariosOrdenados()}>{(operario) => (
            <tr class="text-center border-t">
              <td class="p-2">{operario.nombre}</td>
              <td class="p-2">{operario.email}</td>
              <td class="p-2 flex justify-center gap-2">
                <button class="text-blue-600" onClick={() => props.onVer(operario)}>Ver</button>
                <Show when={props.puedeEditar}>
                  <button class="text-green-600" onClick={() => props.onEditar(operario)}>Editar</button>
                </Show>
                <Show when={props.puedeEliminar}>
                  <button class="text-red-600" onClick={() => props.onEliminar(operario.id)}>Eliminar</button>
                </Show>
              </td>
            </tr>
          )}</For>
        </tbody>
      </table>
    </div>
  );
}
