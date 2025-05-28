import { Show } from 'solid-js';
import type { ConversacionBot } from '@/types/conversacionBot';

interface Props {
  conversacion: ConversacionBot | null;
  onCerrar: () => void;
}

export default function DetalleConversacionModal(props: Props) {
  return (
    <Show when={props.conversacion}>
      {(conversacion) => (
        <div class="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">📄 Detalle de conversación</h2>
              <button class="text-red-500 text-xl" onClick={props.onCerrar}>✕</button>
            </div>

            <div class="text-sm text-gray-700 space-y-2">
              <div>
                <strong>📱 Teléfono:</strong> {conversacion().telefono}
              </div>
              <div>
                <strong>🧍 Mensaje del cliente:</strong>
                <p class="bg-gray-100 p-2 rounded mt-1">{conversacion().mensajeCliente}</p>
              </div>
              <div>
                <strong>🤖 Respuesta del bot:</strong>
                <p class="bg-green-50 p-2 rounded mt-1">{conversacion().respuestaBot}</p>
              </div>
              <div>
                <strong>📤 Derivar:</strong> {conversacion().derivar ? 'Sí' : 'No'}
              </div>
              <div>
                <strong>🕒 Fecha:</strong> {new Date(conversacion().createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
