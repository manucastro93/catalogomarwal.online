import { Show } from 'solid-js';

export default function ModalConfirmacion(props: {
  abierto: boolean;
  mensaje: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
          <p class="text-gray-800 text-center mb-6">{props.mensaje}</p>
          <div class="flex justify-center gap-4">
            <button
              onClick={props.onCancelar}
              class="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400 transition"
            >
              Cancelar
            </button>
            <button
              onClick={props.onConfirmar}
              class="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
