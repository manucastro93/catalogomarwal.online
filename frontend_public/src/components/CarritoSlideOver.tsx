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
  <div
    class={`fixed inset-0 z-40 transition-opacity duration-300 ${
      carritoAbierto()
        ? "bg-black/40 opacity-100"
        : "opacity-0 pointer-events-none"
    }`}
  />

  <div
    class={`fixed top-0 right-0 z-50 h-full flex transition-transform duration-500 ${
      carritoAbierto()
        ? "translate-x-0 scale-100 ease-[cubic-bezier(0.22,1.61,0.36,1)]"
        : "translate-x-full scale-95 ease-in pointer-events-none"
    }`}
  >
    {/* Columna izquierda dentro del panel */}
    <div
      class="w-85 sm:w-12 bg-black/30 text-white flex flex-col items-center justify-center cursor-pointer select-none px-1 py-2 text-center"
      onClick={() => setCarritoAbierto(false)}
    >
      <span class="text-2xl font-bold">→</span>
      <span class="text-[10px] sm:text-xs mt-1 leading-tight">
        Tocá acá<br />para cerrar
      </span>
    </div>

    {/* Panel del carrito */}
    <div class="w-[90vw] sm:w-[400px] h-full bg-white shadow-xl p-4 flex flex-col overflow-auto">
      <h2 class="text-xl font-bold mb-4">¡SU CARRITO!</h2>

      <Show when={carrito.length > 0} fallback={<p>El carrito está vacío.</p>}>
        <div class="flex-1 space-y-4">
          {/* ... todo tu For del carrito ... */}
          <div class="border-t pt-4 mt-4 text-sm space-y-2">
            <p class="text-lg font-bold text-right">
              TOTAL: ${total().toFixed(2)}
            </p>
            <FormularioCliente onConfirmar={handleEnviarPedido} />
          </div>
        </div>
      </Show>
    </div>
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
