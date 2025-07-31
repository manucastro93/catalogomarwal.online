import { createSignal } from 'solid-js';
import type { Cliente } from '@/types/cliente';
import { editarCliente } from '@/services/cliente.service';
import { formatearFechaCorta } from '@/utils/formato';

export default function TabSeguimientoCliente(props: { cliente: Cliente }) {
  const [activo, setActivo] = createSignal(!props.cliente.seguimiento);
  const [observaciones, setObservaciones] = createSignal(props.cliente.observacionesSeguimiento || '');
  const [guardando, setGuardando] = createSignal(false);

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await editarCliente(props.cliente.id, {
        seguimiento: activo(),
        observacionesSeguimiento: observaciones(),
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <label class="font-semibold text-lg">Seguimiento activado:</label>
        <input
          type="checkbox"
          checked={activo()}
          onChange={e => setActivo(e.currentTarget.checked)}
        />
      </div>

      <div>
        <label class="font-semibold text-lg block mb-1">Observaciones internas</label>
        <textarea
          rows={4}
          class="w-full border rounded p-2"
          value={observaciones()}
          onInput={e => setObservaciones(e.currentTarget.value)}
        />
      </div>

      <div class="text-sm text-gray-600">
        Último mensaje automático: {props.cliente.ultimoMensajeAutomatico ? formatearFechaCorta(props.cliente.ultimoMensajeAutomatico) : 'Nunca'}
      </div>

      <button
        onClick={guardarCambios}
        disabled={guardando()}
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
      >
        {guardando() ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
