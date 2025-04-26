import { createSignal, Show, createEffect, For } from "solid-js";
import type { Pedido } from '../../types/pedido';
import { actualizarEstadoPedido } from '../../services/pedido.service';
import ModalMensaje from '../Layout/ModalMensaje';
import { ESTADOS_PEDIDO } from '../../constants/estadosPedidos';

const nombresEstados: Record<number, string> = {
  [ESTADOS_PEDIDO.PENDIENTE]: "Pendiente",
  [ESTADOS_PEDIDO.CONFIRMADO]: "Confirmado",
  [ESTADOS_PEDIDO.PREPARANDO]: "Preparando",
  [ESTADOS_PEDIDO.TERMINADO]: "Terminado",
  [ESTADOS_PEDIDO.ENVIADO]: "Enviado",
  [ESTADOS_PEDIDO.FINALIZADO]: "Finalizado",
  [ESTADOS_PEDIDO.RECHAZADO]: "Rechazado",
  [ESTADOS_PEDIDO.CANCELADO]: "Cancelado",
};

export default function ModalActualizarEstadoPedido(props: {
  pedido: Pedido | null;
  onCerrar: () => void;
  onActualizado: () => void;
}) {
  const [nuevoEstado, setNuevoEstado] = createSignal<number>(ESTADOS_PEDIDO.PENDIENTE);
  const [mensajeExito, setMensajeExito] = createSignal('');

  createEffect(() => {
    if (props.pedido?.estadoPedidoId) {
      setNuevoEstado(props.pedido.estadoPedidoId);
    }
  });

  const actualizarEstado = async () => {
    if (!props.pedido) return;
    try {
      await actualizarEstadoPedido(props.pedido.id, nuevoEstado());
      setMensajeExito('Estado actualizado correctamente');
      props.onActualizado();

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
              onInput={(e) => setNuevoEstado(Number(e.currentTarget.value))}
            >
              <For each={Object.entries(nombresEstados)}>
                {([id, nombre]) => (
                  <option value={Number(id)}>{nombre}</option>
                )}
              </For>
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
