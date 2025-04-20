import { createSignal, Show, createEffect } from 'solid-js';
import type { Pedido } from '../../types/pedido';
import { actualizarEstadoPedido } from '../../services/pedido.service';
import ModalMensaje from '../Layout/ModalMensaje';

export default function ModalActualizarEstadoPedido(props: {
  pedido: Pedido | null;
  onCerrar: () => void;
  onActualizado: () => void;
}) {
  const [nuevoEstado, setNuevoEstado] = createSignal<Pedido['estado']>('pendiente');
  const [mensajeExito, setMensajeExito] = createSignal('');

  // 🔄 Actualiza el estado del select cuando cambia el pedido
  createEffect(() => {
    if (props.pedido) {
      setNuevoEstado(props.pedido.estado);
    }
  });

  const actualizarEstado = async () => {
    if (!props.pedido) return;
    try {
      await actualizarEstadoPedido(props.pedido.id, nuevoEstado());
      setMensajeExito('Estado actualizado correctamente');
      props.onActualizado();

      // ⏳ Espera un segundo antes de cerrar todo (opcional)
      setTimeout(() => {
        setMensajeExito('');
        props.onCerrar();
      }, 1000);
    } catch (err) {
      console.error('Error al actualizar el estado del pedido:', err);
    }
  };

  return (
    <Show when={props.pedido}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Actualizar Estado</h2>
            <button class="text-gray-600 hover:text-black text-2xl" onClick={props.onCerrar}>×</button>
          </div>

          <div class="mb-4">
            <label for="estado" class="block mb-1 font-medium">Nuevo estado:</label>
            <select
              id="estado"
              class="border px-2 py-1 w-full rounded"
              value={nuevoEstado()}
              onInput={(e) => setNuevoEstado(e.currentTarget.value as Pedido['estado'])}
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">Preparando</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div class="text-right">
            <button class="bg-gray-200 px-4 py-2 rounded mr-2" onClick={props.onCerrar}>Cancelar</button>
            <button class="bg-blue-600 text-white px-4 py-2 rounded" onClick={actualizarEstado}>
              Guardar
            </button>
          </div>
        </div>
      </div>

      <ModalMensaje
        mensaje={mensajeExito()}
        cerrar={() => {
          setMensajeExito('');
          props.onCerrar();
        }}
      />
    </Show>
  );
}
