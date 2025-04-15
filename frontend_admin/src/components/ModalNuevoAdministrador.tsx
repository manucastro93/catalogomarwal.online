// src/components/ModalNuevoAdministrador.tsx
import { createSignal, createEffect, Show } from 'solid-js';
import type { Usuario } from '../shared/types/usuario';

interface Props {
  abierto: boolean;
  cerrar: () => void;
  administrador: Usuario | null;
  onGuardar: (admin: Partial<Usuario>) => void;
}

export default function ModalNuevoAdministrador(props: Props) {
  const [nombre, setNombre] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [telefono, setTelefono] = createSignal('');

  createEffect(() => {
    if (props.administrador) {
      setNombre(props.administrador.nombre || '');
      setEmail(props.administrador.email || '');
      setTelefono((props.administrador as any)?.telefono || '');
    } else {
      setNombre('');
      setEmail('');
      setTelefono('');
    }
  });

  const handleSubmit = () => {
    if (!nombre() || !email()) return;
    props.onGuardar({ nombre: nombre(), email: email(), telefono: telefono() });
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div
          class="bg-white p-6 rounded-md w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 class="text-xl font-bold mb-4">
            {props.administrador ? 'Editar Administrador' : 'Nuevo Administrador'}
          </h2>

          <div class="space-y-3">
            <input
              type="text"
              placeholder="Nombre *"
              class="w-full border p-2 rounded"
              value={nombre()}
              onInput={(e) => setNombre(e.currentTarget.value)}
            />
            <input
              type="email"
              placeholder="Email *"
              class="w-full border p-2 rounded"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
            />
            <input
              type="tel"
              placeholder="Teléfono"
              class="w-full border p-2 rounded"
              value={telefono()}
              onInput={(e) => setTelefono(e.currentTarget.value)}
            />
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              class="bg-gray-300 px-4 py-1 rounded"
              onClick={props.cerrar}
            >
              Cancelar
            </button>
            <button
              class="bg-blue-600 text-white px-4 py-1 rounded"
              onClick={handleSubmit}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
