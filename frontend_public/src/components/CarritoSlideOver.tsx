import { createSignal, Show, For, createEffect } from "solid-js";
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
import { formatearPrecio } from "../utils/formato";

export default function CarritoSlideOver() {
  const total = () =>
    carrito.reduce((sum, p) => {
      const precio = Number(p.precio) || 0;
      const cantidad = Number(p.cantidad) || 0;
      return sum + precio * cantidad;
    }, 0);

  const { usuario } = useAuth();
  const [mensaje, setMensaje] = createSignal("");
  const [pedidoEnviado, setPedidoEnviado] = createSignal(false);

  // Control visual para permitir animación de cierre antes de desmontar
  const [showMobile, setShowMobile] = createSignal(false);
  const [showDesktop, setShowDesktop] = createSignal(false);

  // Reactivo: cuando cambia carritoAbierto, animamos entrada/salida
  createEffect(() => {
    const open: boolean = carritoAbierto();
    if (open) {
      setShowMobile(true);
      setShowDesktop(true);
    } else {
      setTimeout(() => setShowMobile(false), 300);
      setTimeout(() => setShowDesktop(false), 300);
    }
  });

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
      {/* FONDO OSCURO */}
      <Show when={carritoAbierto()}>
        <div
          class="fixed inset-0 z-40 bg-black/40"
          onClick={() => setCarritoAbierto(false)}
        />
      </Show>

      {/* MOBILE: CARRITO DESDE ARRIBA */}
      <Show when={showMobile()}>
        <div
          class={`fixed top-[70px] left-0 right-0 z-40 md:hidden bg-white shadow-lg p-4 overflow-auto max-h-[80vh] ${
            carritoAbierto() ? "animate-slideDown" : "animate-slideUp"
          }`}
        >
          <h2 class="text-xl font-bold mb-4">¡SU CARRITO!</h2>
          <Show
            when={carrito.length > 0}
            fallback={<p>El carrito está vacío.</p>}
          >
            <ContenidoCarrito
              onConfirmar={handleEnviarPedido}
              total={total()}
            />
          </Show>
        </div>
      </Show>

      {/* DESKTOP: CARRITO DESDE LA DERECHA */}
      <Show when={showDesktop()}>
        <>
          {/* Flecha para cerrar */}
          <div
            class="fixed top-1/2 right-[400px] z-50 -translate-y-1/2 bg-black text-white px-2 py-1 text-xl rounded-l-2xl cursor-pointer hover:bg-gray-800 shadow hidden md:flex flex-col items-center"
            onClick={() => setCarritoAbierto(false)}
          >
            <span class="leading-tight text-center">cerrar</span>
            <span class="text-xl">→</span>
          </div>

          {/* Panel carrito */}
          <div
            class={`fixed top-0 right-0 h-full w-[400px] bg-white p-4 shadow-xl overflow-auto hidden md:flex flex-col z-50 ${
              carritoAbierto()
                ? "animate-slideInRight"
                : "animate-slideOutRight"
            }`}
          >
            <h2 class="text-xl font-bold mb-4">¡SU CARRITO!</h2>
            <Show
              when={carrito.length > 0}
              fallback={<p>El carrito está vacío.</p>}
            >
              <ContenidoCarrito
                onConfirmar={handleEnviarPedido}
                total={total()}
              />
            </Show>
          </div>
        </>
      </Show>

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>

      {/* BOTÓN FLOTANTE SOLO EN DESKTOP */}
      <Show when={!carritoAbierto()}>
        <button
          class="hidden md:block fixed bottom-5 right-5 bg-black text-white text-4xl p-5 rounded-full shadow-xl transition-all duration-300 ease-out scale-90 opacity-100 animate-[fadeIn_.3s_ease-out_forwards] z-50"
          onClick={() => setCarritoAbierto(true)}
          aria-label="Abrir carrito"
        >
          🛒
        </button>
      </Show>
    </>
  );
}

function ContenidoCarrito(props: {
  onConfirmar: (datosCliente: any) => void;
  total: number;
}) {
  return (
    <div class="flex-1 space-y-4">
      <For each={carrito}>
        {(item) => {
          const unidades = item.cantidad * (item.unidadPorBulto || 1);
          const precioUnitario = item.unidadPorBulto
            ? item.precio / item.unidadPorBulto
            : undefined;

          return (
            <div class="flex items-start gap-3 text-sm border-b pb-2">
              {/* Imagen */}
              <img
                src={`${import.meta.env.VITE_UPLOADS_URL}${item.imagen}`}
                alt={item.nombre}
                class="object-contain w-16 h-16"
              />

              {/* Info producto */}
              <div class="flex-1">
                <p class="font-semibold">{item.nombre}</p>
                <p class="text-xs text-gray-500">
                  x{item.cantidad} bultos ({unidades} unidades)
                </p>
                <p class="text-xs text-gray-500">
                  {formatearPrecio(item.precio)} x bulto
                </p>
                {precioUnitario && (
                  <p class="text-[11px] text-gray-400">
                    ({formatearPrecio(precioUnitario)} c/u)
                  </p>
                )}
              </div>

              {/* Controles cantidad */}
              <div class="flex flex-col gap-1 items-end">
                <div class="flex items-center gap-1">
                  <button
                    class="px-2 h-8 text-sm border rounded"
                    onClick={() =>
                      cambiarCantidad(item.id, Math.max(1, item.cantidad - 1))
                    }
                  >
                    -
                  </button>
                  <input
                    type="number"
                    class="w-12 h-8 text-sm border rounded text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
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
                </div>
                <button
                  onClick={() => quitarDelCarrito(item.id)}
                  class="text-red-500 text-base"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        }}
      </For>

      <div class="border-y pt-4 pb-4 my-4 text-sm space-y-1 text-right">
        <p class="text-lg font-bold">
          TOTAL: {formatearPrecio(props.total)}
        </p>
        <p class="text-sm text-gray-500">+ IVA</p>
      </div>
      <FormularioCliente onConfirmar={props.onConfirmar} />
    </div>
  );
}
