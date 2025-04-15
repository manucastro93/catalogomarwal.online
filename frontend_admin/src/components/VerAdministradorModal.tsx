import type { Usuario } from '../shared/types/usuario';

interface VerAdministradorModalProps {
  administrador: Usuario | null;
  abierto: boolean;
  onCerrar: () => void;
}

export default function VerAdministradorModal(props: VerAdministradorModalProps) {
  return (
    <div
      class={`fixed inset-0 z-40 flex items-center justify-center bg-black/50 ${props.abierto ? 'block' : 'hidden'}`}
      onClick={props.onCerrar}
    >
      <div
        class="bg-white p-6 rounded-md w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 class="text-2xl font-bold mb-4">Detalles del Administrador</h2>

        <div class="space-y-2">
          <div><strong>Nombre:</strong> {props.administrador?.nombre}</div>
          <div><strong>Email:</strong> {props.administrador?.email}</div>
          <div><strong>Teléfono:</strong> {props.administrador?.telefono}</div>
        </div>

        <div class="text-right mt-6">
          <button
            onClick={props.onCerrar}
            class="bg-gray-300 px-4 py-1 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
