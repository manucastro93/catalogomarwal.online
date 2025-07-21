import { For, Show } from 'solid-js';
import type { Cliente } from '@/types/cliente';
import type { ClienteDux } from '@/types/clienteDux';

export default function TablaClientes(props: {
  clientes: Cliente[];
  puedeEditar: boolean;
  onVer: (c: Cliente) => void;
  onEditar: (c: Cliente) => void;
  onOrdenar: (col: string) => void;
  mostrarClientesDux: boolean;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <Show
        when={props.mostrarClientesDux}
        fallback={
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('nombre')}>Nombre</th>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('email')}>Email</th>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('provincia')}>Provincia</th>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('localidad')}>Localidad</th>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('vendedor')}>Vendedor</th>
                <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('createdAt')}>Creado</th>
                <th class="text-left p-3 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <Show when={props.clientes.length > 0} fallback={
                <tr><td colspan="7" class="text-center p-4 text-gray-500">No se encontraron clientes</td></tr>
              }>
                <For each={props.clientes}>
                  {(c: any) => (
                    <tr class="hover:bg-gray-50 border-b">
                      <td class="p-3">{c.nombre}</td>
                      <td class="p-3">{c.email}</td>
                      <td class="p-3">{c.provincia?.nombre}</td>
                      <td class="p-3">{c.localidad?.nombre}</td>
                      <td class="p-3">{c.vendedor?.nombre}</td>
                      <td class="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td class="p-3 flex gap-2">
                        <button class="text-blue-600 hover:underline" onClick={() => props.onVer(c)}>Ver</button>
                        <Show when={props.puedeEditar}>
                          <button class="text-green-600 hover:underline" onClick={() => props.onEditar(c)}>Editar</button>
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        }
      >
        {/* 👉 Tabla para clientes Dux */}
        <table class="w-full text-sm border-collapse">
          <thead class="bg-blue-100 sticky top-0">
            <tr>
              <th class="text-left p-3 border-b">Cliente</th>
              <th class="text-left p-3 border-b">CUIT</th>
              <th class="text-left p-3 border-b">Vendedor</th>
              <th class="text-left p-3 border-b">Categoría Fiscal</th>
              <th class="text-left p-3 border-b">Provincia</th>
              <th class="text-left p-3 border-b">Localidad</th>
              <th class="text-left p-3 border-b">Creado</th>
            </tr>
          </thead>
          <tbody>
            <Show when={props.clientes.length > 0} fallback={
              <tr><td colspan="8" class="text-center p-4 text-gray-500">No se encontraron clientes Dux</td></tr>
            }>
              <For each={props.clientes}>
                {(c: any) => (
                  <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3">{c.cliente}</td>
                    <td class="p-3">{c.cuitCuil}</td>
                    <td class="p-3">{c.vendedor}</td>
                    <td class="p-3">{c.categoriaFiscal}</td>
                    <td class="p-3">{c.provincia}</td>
                    <td class="p-3">{c.localidad}</td>
                    <td class="p-3">{new Date(c.fechaCreacion || c.createdAt).toLocaleDateString()}</td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
