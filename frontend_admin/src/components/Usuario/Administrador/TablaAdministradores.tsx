import { For, Show } from 'solid-js';
import type { Usuario } from '@/types/usuario';

export default function TablaAdministradores(props: {
  administradores: Usuario[];
  onVer: (a: Usuario) => void;
  onEditar: (a: Usuario) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="text-left p-3">Nombre</th>
            <th class="text-left p-3">Email</th>
            <th class="text-left p-3">Teléfono</th>
            <th class="text-left p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.administradores.length > 0}
            fallback={
              <tr>
                <td colSpan={4} class="p-4 text-center text-gray-500">
                  No se encontraron administradores
                </td>
              </tr>
            }
          >
            <For each={props.administradores}>
              {(a) => (
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">{a.nombre}</td>
                  <td class="p-3">{a.email}</td>
                  <td class="p-3">{a.telefono || '-'}</td>
                  <td class="p-3 flex gap-2">
                    <button class="text-blue-600 hover:underline" onClick={() => props.onVer(a)}>
                      Ver
                    </button>
                    <button class="text-green-600 hover:underline" onClick={() => props.onEditar(a)}>
                      Editar
                    </button>
                    <button class="text-red-600 hover:underline" onClick={() => props.onEliminar(a.id)}>
                      Eliminar
                    </button>
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
