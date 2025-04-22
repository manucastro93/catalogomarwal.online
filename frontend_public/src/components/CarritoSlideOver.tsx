import {
  createSignal,
  Show,
  For,
  createEffect,
  onCleanup,
  onMount,
} from "solid-js";
import {
  carrito,
  setCarrito,
  carritoAbierto,
  setCarritoAbierto,
  quitarDelCarrito,
  cambiarCantidad,
  limpiarCarrito,
} from "../store/carrito";
import {
  enviarPedido,
  validarCarrito,
  obtenerPedidoPorId,
} from "../services/pedido.service";
import { useAuth } from "../store/auth";
import FormularioCliente from "../components/FormularioCliente";
import ModalMensaje from "./ModalMensaje";
import { formatearPrecio } from "../utils/formato";
import EnviandoOverlay from "./EnviandoOverlay";

export default function CarritoSlideOver() {
  const total = () =>
    carrito.reduce(
      (sum, p) => sum + (Number(p.precio) || 0) * (Number(p.cantidad) || 0),
      0
    );

  const { usuario } = useAuth();
  const [mensaje, setMensaje] = createSignal("");
  const [enviando, setEnviando] = createSignal(false);
  const [showMobile, setShowMobile] = createSignal(false);
  const [showDesktop, setShowDesktop] = createSignal(false);
  const [pid, setPid] = createSignal<string | null>(null);
  const [isEditing, setIsEditing] = createSignal(false);
  const [validandoEdicion, setValidandoEdicion] = createSignal(true);
  const [erroresDetalle, setErroresDetalle] = createSignal<any[]>([]);
  // ✅ Al montar, recuperar modo edición
  onMount(() => {
    const id = localStorage.getItem("modoEdicionPedidoId");
    const abrir = localStorage.getItem("abrirCarrito");

    if (id) {
      setPid(id);
    }

    if (abrir === "1") {
      setCarritoAbierto(true);
      localStorage.removeItem("abrirCarrito");
    }
  });

  // 🧠 Estado de edición
  createEffect(() => {
    const idStr = pid();

    if (!idStr) {
      setIsEditing(false);
      setValidandoEdicion(false);
      return;
    }

    const id = Number(idStr);
    setValidandoEdicion(true);

    const checkEstado = async () => {
      try {
        const pedido = await obtenerPedidoPorId(id);
        if (pedido.estadoEdicion === "editando") {
          setIsEditing(true);
        } else {
          console.warn("⏳ Pedido no está en edición");
          limpiarModoEdicion();
        }
      } catch {
        console.warn("❌ Error al obtener pedido");
        limpiarModoEdicion();
      } finally {
        setValidandoEdicion(false);
      }
    };

    checkEstado();

    const interval = setInterval(checkEstado, 60000);
    onCleanup(() => clearInterval(interval));
  });

  const limpiarModoEdicion = () => {
    setIsEditing(false);
    setPid(null);
    localStorage.removeItem("modoEdicionPedidoId");
  };

  // 🎬 Control visual de SlideOver
  createEffect(() => {
    if (carritoAbierto()) {
      setShowMobile(true);
      setShowDesktop(true);
    } else {
      setTimeout(() => setShowMobile(false), 300);
      setTimeout(() => setShowDesktop(false), 300);
    }
  });
  const handleEnviarPedido = async (datosCliente: any) => {
    if (!pid() && localStorage.getItem("modoEdicionPedidoId")) {
      setMensaje(
        "Ya estás editando un pedido. Confirmalo o cancelalo primero."
      );
      setEnviando(false);
      return;
    }

    setEnviando(true);
    const vendedorRaw = localStorage.getItem("vendedor");
    const vendedor = vendedorRaw ? JSON.parse(vendedorRaw) : null;

    if (!datosCliente?.nombre?.trim() || !datosCliente?.telefono?.trim()) {
      setMensaje("Por favor completá nombre y teléfono.");
      setEnviando(false);
      return;
    }

    const carritoPlano = carrito.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      precioPorBulto: item.precioPorBulto,
      unidadPorBulto: item.unidadPorBulto,
      usuarioId: vendedor?.id,
    }));

    try {
      await validarCarrito(carritoPlano);
      const clienteId = Number(localStorage.getItem("clienteId"));
      const res = await enviarPedido({
        cliente: { ...datosCliente, vendedorId: vendedor?.id, clienteId },
        carrito: carritoPlano,
        usuarioId: vendedor?.id,
        pedidoId: pid() ? Number(pid()) : null,
      });

      if (res.clienteId) {
        localStorage.setItem("clienteId", String(res.clienteId));
      }

      limpiarCarrito();
      localStorage.removeItem("modoEdicionPedidoId");
      setPid(null);
      setCarritoAbierto(false);
      setMensaje(
        "¡Pedido enviado con éxito!. Podés revisarlo en la sección 'Mis Pedidos'."
      );
      setTimeout(() => setMensaje(""), 9000);
    } catch (error: any) {
      console.error("❌ Error al enviar pedido:", error);

      if (error?.errores?.length) {
        if (error.carritoActualizado?.length) {
          const nuevo = error.carritoActualizado.map((p: any) => ({
            id: p.id,
            nombre: p.nombre,
            precio: p.precio,
            precioPorBulto: p.precio,
            unidadPorBulto: p.unidadPorBulto,
            cantidad: 1,
            imagen: p.imagen || "",
          }));
          setCarrito(nuevo);
        }

        const resumen = error.errores
          .map((e: any) =>
            e.motivo === "El precio fue modificado."
              ? `🛑 ${e.nombre || "Producto"}: ${e.motivo} (${formatearPrecio(
                  e.precioCliente
                )} ➜ ${formatearPrecio(e.precioActual)})`
              : `🛑 ${e.nombre || "Producto"}: ${e.motivo}`
          )
          .join("\n");

        setMensaje(
          `Algunos productos fueron modificados. El carrito fue actualizado con los datos vigentes:\n${resumen}`
        );
      } else {
        setMensaje(error?.mensaje || "Hubo un error al enviar el pedido.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Show when={enviando()}>
        <EnviandoOverlay />
      </Show>

      <Show when={carritoAbierto()}>
        <div
          class="fixed inset-0 z-40 bg-black/40"
          onClick={() => setCarritoAbierto(false)}
        />
      </Show>

      <Show when={showMobile()}>
        <div
          class={`fixed top-[70px] left-0 right-0 z-40 md:hidden bg-white shadow-lg p-4 overflow-auto max-h-[80vh] ${
            carritoAbierto() ? "animate-slideDown" : "animate-slideUp"
          }`}
        >
          <h2 class="text-xl font-bold mb-4">¡SU CARRITO!</h2>
          <Show when={pid() && isEditing()}>
            <div class="text-yellow-500 font-semibold text-sm mb-2">
              EDITANDO PEDIDO #{pid()}
            </div>
          </Show>
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

      <Show when={showDesktop()}>
        <>
          <div
            class="fixed top-1/2 right-[400px] z-50 -translate-y-1/2 bg-black text-white px-2 py-1 text-xl rounded-l-2xl cursor-pointer hover:bg-gray-800 shadow hidden md:flex flex-col items-center"
            onClick={() => setCarritoAbierto(false)}
          >
            <span>cerrar</span>
            <span>→</span>
          </div>
          <div
            class={`fixed top-0 right-0 h-full w-[400px] bg-white p-4 shadow-xl overflow-auto hidden md:flex flex-col z-50 ${
              carritoAbierto()
                ? "animate-slideInRight"
                : "animate-slideOutRight"
            }`}
          >
            <Show when={pid() && isEditing()}>
              <div class="text-yellow-500 font-semibold text-sm mb-2">
                EDITANDO PEDIDO #{pid()}
              </div>
            </Show>
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
        <ModalMensaje
          tipo="error"
          titulo="No se pudo procesar el pedido"
          mensaje={mensaje()}
          errores={erroresDetalle()}
          notaFinal="El carrito se ha actualizado automáticamente con los datos vigentes.\nAhora podrás confirmar el pedido nuevamente."
          cerrar={() => {
            setMensaje("");
            setErroresDetalle([]);
          }}
        />
      </Show>

      <Show when={!carritoAbierto()}>
        <button
          class="hidden md:block fixed bottom-5 right-5 bg-black text-white text-4xl p-5 rounded-full shadow-xl animate-fadeIn z-50"
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
              <img
                src={`${import.meta.env.VITE_UPLOADS_URL}${item.imagen}`}
                alt={item.nombre}
                class="object-contain w-16 h-16"
              />
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
              <div class="flex flex-col gap-1 items-end">
                <div class="flex items-center gap-1">
                  <button
                    class="px-2 h-8 border rounded"
                    onClick={() =>
                      cambiarCantidad(item.id, Math.max(1, item.cantidad - 1))
                    }
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.cantidad}
                    min={1}
                    onInput={(e) =>
                      cambiarCantidad(item.id, +e.currentTarget.value)
                    }
                    class="w-12 h-8 text-sm border rounded text-center"
                  />
                  <button
                    class="px-2 h-8 border rounded"
                    onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  class="text-red-500"
                  onClick={() => quitarDelCarrito(item.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        }}
      </For>
      <div class="border-y py-4 text-sm text-right">
        <p class="text-lg font-bold">TOTAL: {formatearPrecio(props.total)}</p>
        <p class="text-sm text-gray-500">+ IVA</p>
      </div>
      <FormularioCliente onConfirmar={props.onConfirmar} />
    </div>
  );
}
