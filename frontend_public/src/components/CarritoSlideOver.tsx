import { createSignal, Show, For } from "solid-js";
import {
  carrito,
  carritoAbierto,
  setCarritoAbierto,
  quitarDelCarrito,
  cambiarCantidad,
  limpiarCarrito,
} from "../store/carrito";
import { enviarPedido } from "../services/pedido.service";
import { useAuth } from "../store/auth";
import FormularioCliente from "../components/FormularioCliente";
import ModalMensaje from "./ModalMensaje";

export default function CarritoSlideOver() {
  const total = () =>
    carrito.reduce((sum, p) => {
      const precio = Number(p.precio) || 0;
      const cantidad = Number(p.cantidad) || 0;
      return sum + precio * cantidad;
    }, 0);

  const { usuario } = useAuth();
  const [pedidoEnviado, setPedidoEnviado] = createSignal(false);
  const [mensaje, setMensaje] = createSignal("");

  const handleEnviarPedido = async (datosCliente: any) => {
    const vendedorRaw = localStorage.getItem("vendedor");
    const vendedorId = vendedorRaw ? JSON.parse(vendedorRaw).id : undefined;

    if (!datosCliente?.nombre?.trim() || !datosCliente?.telefono?.trim()) {
      setMensaje("Por favor completá nombre y teléfono.");
      return;
    }

    const carritoPlano = carrito.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      precioPorBulto: item.precioPorBulto,
      unidadPorBulto: item.unidadPorBulto,
    }));

    try {
      const res = await enviarPedido({
        cliente: {
          ...datosCliente,
          vendedorId: vendedorId ? Number(vendedorId) : undefined,
        },
        carrito: carritoPlano,
        usuarioId: vendedorId,
      });

      if (res?.clienteId) {
        localStorage.setItem("clienteId", res.clienteId.toString());
      }

      limpiarCarrito();
      setCarritoAbierto(false);
      setPedidoEnviado(true);
      setMensaje("¡Pedido enviado con éxito!");
      setTimeout(() => setMensaje(""), 8000);
    } catch (error) {
      console.error("❌ Error al enviar pedido:", error);
      setMensaje("Hubo un error al enviar el pedido. Intentalo nuevamente.");
    }
  };

  return (
    <>
      <Show when={true}>
        {/* Fondo oscuro con transición */}
        <div
          class={`fixed inset-0 z-40 transition-opacity duration-300 ${
            carritoAbierto()
              ? "bg-black/40 opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => carritoAbierto() && setCarritoAbierto(false)}
        />

        {/* Panel deslizante con rebote */}
        <div
          class={`fixed top-0 right-0 h-full w-[90%] sm:w-[400px] bg-white z-50 shadow-xl p-4 flex flex-col overflow-auto transform transition-transform duration-500 ${
            carritoAbierto()
              ? "translate-x-0 scale-100 ease-[cubic-bezier(0.22,1.61,0.36,1)]"
              : "translate-x-full scale-95 ease-in pointer-events-none"
          }`}
        >
          <h2 class="text-xl font-bold mb-4">¡SU CARRITO!</h2>

          <Show
            when={carrito.length > 0}
            fallback={<p>El carrito está vacío.</p>}
          >
            <div class="flex-1 space-y-4">
              <For each={carrito}>
                {(item) => {
                  const unidades = item.cantidad * (item.unidadPorBulto || 1);
                  const precioUnitario = item.unidadPorBulto
                    ? item.precio / item.unidadPorBulto
                    : undefined;

                  return (
                    <div class="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <p class="font-semibold">{item.nombre}</p>
                        <p class="text-xs text-gray-500">
                          x{item.cantidad} bultos ({unidades} unidades)
                        </p>
                        <p class="text-xs text-gray-500">
                          ${item.precio.toFixed(2)} por bulto
                        </p>
                        {precioUnitario && (
                          <p class="text-[11px] text-gray-400">
                            (${precioUnitario.toFixed(2)} c/u)
                          </p>
                        )}
                      </div>
                      <div class="flex gap-1 items-center">
                        <button
                          class="px-2 h-8 text-sm border rounded"
                          onClick={() =>
                            cambiarCantidad(
                              item.id,
                              Math.max(1, item.cantidad - 1)
                            )
                          }
                        >
                          -
                        </button>

                        <input
                          type="number"
                          class="w-14 h-8 text-sm border rounded text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                          min={1}
                          value={item.cantidad}
                          onInput={(e) =>
                            cambiarCantidad(item.id, +e.currentTarget.value)
                          }
                        />

                        <button
                          class="px-2 h-8 text-sm border rounded"
                          onClick={() =>
                            cambiarCantidad(item.id, item.cantidad + 1)
                          }
                        >
                          +
                        </button>

                        <button
                          onClick={() => quitarDelCarrito(item.id)}
                          class="text-red-500 ml-1 text-base"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                }}
              </For>

              <div class="border-t pt-4 mt-4 text-sm space-y-2">
                <p class="text-lg font-bold text-right">
                  TOTAL: ${total().toFixed(2)}
                </p>

                <FormularioCliente onConfirmar={handleEnviarPedido} />
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Mensaje visual */}
      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>

      {/* Botón flotante animado */}
      <Show when={!carritoAbierto()}>
        <button
          class="fixed bottom-5 right-5 bg-black text-white text-4xl p-5 rounded-full shadow-xl transition-all duration-300 ease-out scale-90 opacity-0 animate-[fadeIn_.3s_ease-out_forwards] z-50"
          onClick={() => setCarritoAbierto(true)}
          aria-label="Abrir carrito"
        >
          🛒
        </button>
      </Show>

      {/* Animación para el botón */}
      <style>
        {`
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </>
  );
}
