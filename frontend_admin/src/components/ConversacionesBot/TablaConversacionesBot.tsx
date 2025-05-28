import { Show, For } from 'solid-js';
import { ConversacionBot } from '@/types/conversacionBot';

interface Props {
  conversaciones: ConversacionBot[];
  onOrdenar: (campo: string) => void;
}

export default function TablaConversacionesBot({ conversaciones, onOrdenar }: Props) {
  return (
    <div class="overflow-x-auto border rounded-md">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 cursor-pointer" onClick={() => onOrdenar('createdAt')}>Fecha</th>
            <th class="px-4 py-2 cursor-pointer" onClick={() => onOrdenar('telefono')}>Teléfono</th>
            <th class="px-4 py-2">Mensaje</th>
            <th class="px-4 py-2">Respuesta</th>
            <th class="px-4 py-2">Derivar</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <Show when={conversaciones.length} fallback={<tr><td colspan="5" class="text-center py-4">No hay conversaciones</td></tr>}>
            <For each={conversaciones}>{(c) => (
              <tr>
                <td class="px-4 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                <td class="px-4 py-2 font-semibold">{c.telefono}</td>
                <td class="px-4 py-2 whitespace-pre-wrap">{c.mensajeCliente}</td>
                <td class="px-4 py-2 whitespace-pre-wrap">{c.respuestaBot}</td>
                <td class="px-4 py-2 text-center">{c.derivar ? '✅' : ''}</td>
              </tr>
            )}</For>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
