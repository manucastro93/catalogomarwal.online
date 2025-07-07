import { For, Show } from 'solid-js';
import type { Proveedor } from '@/types/proveedor';

export default function TablaProveedores(props: {
  proveedores: Proveedor[];
  puedeEditar: boolean;
  onVer: (p: Proveedor) => void;
  onEditar: (p: Proveedor) => void;
  onOrdenar: (col: string) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('nombre')}>Nombre</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('tipoDoc')}>Tipo Doc</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('nroDoc')}>Nro Doc</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('email')}>Email</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('telefono')}>Teléfono</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('provincia')}>Provincia</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('localidad')}>Localidad</th>
            <th class="text-left p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show when={props.proveedores.length > 0} fallback={
            <tr><td colspan="9" class="text-center p-4 text-gray-500">No se encontraron proveedores</td></tr>
          }>
            <For each={props.proveedores}>
              {(p) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td class="p-3">{p.nombre}</td>
                  <td class="p-3">{p.tipoDoc}</td>
                  <td class="p-3">{p.nroDoc}</td>
                  <td class="p-3">{p.email}</td>
                  <td class="p-3">{p.telefono}</td>
                  <td class="p-3">{p.provincia}</td>
                  <td class="p-3">{p.localidad}</td>
                  <td class="p-3 flex gap-2">
                    <button class="text-blue-600 hover:underline" onClick={() => props.onVer(p)}>Ver</button>
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
