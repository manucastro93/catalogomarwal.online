import { Show } from 'solid-js';
import type { Usuario } from '@/types/usuario';

interface Props {
  abierto: boolean;
  usuario: Usuario | null;
  onCerrar: () => void;
}

export default function VerOperarioModal(props: Props) {
  return (
    <Show when={props.abierto && props.usuario}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
          <h2 class="text-xl font-bold mb-4">Datos del Operario</h2>

          <div class="space-y-2 text-gray-700">
          <div><strong>Tipo:</strong> {props.usuario?.rolUsuario?.nombre}</div>
            <div><strong>Nombre:</strong> {props.usuario?.nombre}</div>
            <div><strong>Email:</strong> {props.usuario?.email}</div>
            <div><strong>Teléfono:</strong> {props.usuario?.telefono || '-'}</div>
          </div>

          <button
            class="absolute top-2 right-2 text-gray-600 hover:text-black"
            onClick={props.onCerrar}
          >
            ✕
          </button>

          <div class="flex justify-end mt-6">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={props.onCerrar}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
