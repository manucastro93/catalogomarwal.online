import { createSignal, Show, For } from "solid-js";
import dayjs from "dayjs";

interface Props {
  pedido: any;
  onCerrar: () => void;
  onCancelar: () => void;
  onModificar: () => void;
}

export default function ModalPedido({ pedido, onCerrar, onCancelar, onModificar }: Props) {
  const [confirmando, setConfirmando] = createSignal(false);

  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div class="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-xl relative border">
        {/* Botón cerrar */}
        <button
          class="absolute top-3 right-4 text-xl text-gray-500 hover:text-black"
          onClick={onCerrar}
        >
          ✕
        </button>

        <h2 class="text-2xl font-bold mb-2">Pedido #{pedido.id}</h2>
        <p class="text-sm text-gray-500 mb-4">
          Fecha: {dayjs(pedido.createdAt).format("DD/MM/YYYY HH:mm")}
        </p>

        <div class="space-y-2 text-sm">
          <For each={pedido.detalles}>
            {(item) => (
              <div class="flex justify-between">
                <span>{item.Producto?.nombre || 'Producto'} x {item.cantidad} bultos</span>
                <span>${item.subtotal}</span>
              </div>
            )}
          </For>

          <hr class="my-2" />
          <div class="flex justify-between font-bold text-base">
            <span>Total:</span>
            <span>${pedido.total}</span>
          </div>
        </div>

        <p class="mt-4 text-sm text-gray-600">Estado: {pedido.estado}</p>

        {/* Botones si está pendiente */}
        <Show when={pedido.estado?.toLowerCase().trim() === "pendiente"}>
          <div class="mt-6 flex gap-3 justify-end">
            <button
              class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
              onClick={onModificar}
            >
              Modificar
            </button>
            <button
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              onClick={() => {
                if (confirmando()) {
                  onCancelar(); // llama a la función que ya hicimos en MisPedidos.tsx
                } else {
                  setConfirmando(true);
                }
              }}
            >
              {confirmando() ? "Confirmar cancelación" : "Cancela Pedido"}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
