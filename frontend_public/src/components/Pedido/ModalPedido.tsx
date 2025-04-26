// 🔵 SolidJS imports
import { createSignal, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
// 📅 External libraries
import dayjs from "dayjs";
// 🛠️ Utils
import { formatearPrecio } from "@/utils/formato";
// 🌐 Services
import { marcarComoEditando, duplicarPedido, cancelarPedidoDesdeCliente } from "@/services/pedido.service";
// 🧩 UI Components
import EnviandoOverlay from "@/components/UI/EnviandoOverlay";
import ModalMensaje from "@/components/UI/ModalMensaje";
// 🗂️ Store
import { setCarrito, limpiarCarrito } from "@/store/carrito";


interface Props {
  pedido: any;
  onCerrar: () => void;
  onDuplicado: () => void;
  setMensaje: (msg: string) => void;
}

export default function ModalPedido({
  pedido,
  onCerrar,
  onDuplicado,
  setMensaje,
}: Props) {
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [duplicando, setDuplicando] = createSignal(false);
  const [exitoDuplicar, setExitoDuplicar] = createSignal(false);
  const [errorDuplicar, setErrorDuplicar] = createSignal<string | null>(null);
  const [activandoEdicion, setActivandoEdicion] = createSignal(false);
  const [cancelando, setCancelando] = createSignal(false);
  const navigate = useNavigate();

  const esPendiente = pedido.estadoPedido?.nombre?.toLowerCase().trim() === "pendiente";
  const estaEditando = pedido.estadoEdicion === true;
  const puedeCancelar = esPendiente || estaEditando;
  const puedeModificar = esPendiente && !estaEditando;

  const handleDuplicarPedido = async () => {
    if (!pedido) return;
    setErrorDuplicar(null);
    setDuplicando(true);
    try {
      await duplicarPedido(pedido.id);
      setExitoDuplicar(true);
      onDuplicado();
    } catch (e: any) {
      console.error("❌ Error al duplicar el pedido:", e);
      setErrorDuplicar(e.message || "Error al duplicar pedido");
    } finally {
      setDuplicando(false);
    }
  };

  const confirmarCancelacion = async () => {
    try {
      setCancelando(true);
      await cancelarPedidoDesdeCliente(pedido.id); // ✅ Siempre cancelar desde cliente
      localStorage.removeItem("modoEdicionPedidoId");
      localStorage.removeItem("abrirCarrito");

      setMensaje("✅ Pedido cancelado correctamente");
      setShowConfirm(false);
      onDuplicado();
    } catch (err: any) {
      console.error("❌ Error al cancelar el pedido:", err);
      setMensaje(err?.message || "No se pudo cancelar el pedido.");
    } finally {
      setCancelando(false);
    }
  };

  const modificarPedido = async () => {
    try {
      limpiarCarrito();
      const nuevoCarrito = pedido.detalles.map((item: any) => ({
        id: item.productoId,
        nombre: item.producto?.nombre,
        cantidad: item.cantidad,
        precio: item.precioXBulto,
        unidadPorBulto: item.producto?.unidadPorBulto || 1,
        imagen: item.producto?.Imagenes?.[0]?.url || "",
      }));

      localStorage.setItem("modoEdicionPedidoId", String(pedido.id));
      localStorage.setItem("abrirCarrito", "1");
      setCarrito(nuevoCarrito);
      localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));

      setActivandoEdicion(true);
      await marcarComoEditando(pedido.id);

      navigate(`/editar/${pedido.id}`);
    } catch (error) {
      console.error("❌ No se pudo marcar como editando:", error);
    }
  };

  return (
    <>
      {/* Loading overlays */}
      <Show when={duplicando()}>
        <div class="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
          <EnviandoOverlay />
        </div>
      </Show>

      <Show when={cancelando()}>
        <div class="fixed inset-0 bg-black/40 z-80 flex items-center justify-center">
          <div class="bg-white px-6 py-4 rounded-lg shadow-lg text-lg font-semibold">
            Cancelando pedido...
          </div>
        </div>
      </Show>

      {/* Mensajes de éxito / error */}
      <Show when={exitoDuplicar()}>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <ModalMensaje
            mensaje="Pedido duplicado correctamente"
            cerrar={() => {
              setExitoDuplicar(false);
              onCerrar();
            }}
          />
        </div>
      </Show>

      <Show when={!!errorDuplicar()}>
        <div class="fixed inset-0 flex items-center justify-center z-50">
          <ModalMensaje
            mensaje={errorDuplicar()!}
            cerrar={() => setErrorDuplicar(null)}
          />
        </div>
      </Show>

      <Show when={activandoEdicion()}>
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div class="bg-white px-6 py-4 rounded-lg shadow-lg text-lg font-semibold">
            Activando modo edición...
          </div>
        </div>
      </Show>

      {/* Confirmación de cancelación */}
      <Show when={showConfirm()}>
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div class="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <p class="text-base mb-4">
              ¿Estás seguro de que deseas cancelar este pedido?
            </p>
            <div class="flex justify-end gap-2">
              <button
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                onClick={confirmarCancelacion}
              >
                Sí, cancelar
              </button>
              <button
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                onClick={() => setShowConfirm(false)}
              >
                No, volver
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Contenido del modal */}
      <div class="fixed inset-0 bg-black/40 z-30 flex items-center justify-center px-4">
        <div class="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-xl relative border">
          <button
            class="absolute top-3 right-4 text-xl text-gray-500 hover:text-black"
            onClick={onCerrar}
            disabled={duplicando() || showConfirm()}
          >
            ✕
          </button>

          <h2 class="text-2xl font-bold mb-2">Pedido #{pedido.id}</h2>
          <p class="mt-4 text-sm text-gray-600">
            Estado: {estaEditando ? "🛠 En edición" : pedido.estadoPedido?.nombre || "—"}
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Fecha: {dayjs(pedido.createdAt).format("DD/MM/YYYY HH:mm")}
          </p>

          <div class="space-y-4 text-sm overflow-auto max-h-96">
            <For each={pedido.detalles}>
              {(item) => (
                <div class="flex items-center gap-4 border-b pb-2">
                  <img
                    src={
                      item.producto?.Imagenes?.[0]?.url
                        ? `${import.meta.env.VITE_UPLOADS_URL}${item.producto.Imagenes[0].url}`
                        : "/sin-imagen.jpg"
                    }
                    alt={item.producto?.nombre || "Producto"}
                    class="w-16 h-16 object-cover rounded"
                  />
                  <div class="flex justify-between w-full">
                    <div>
                      <div class="font-medium">{item.producto?.nombre || "Producto"}</div>
                      <div class="text-xs text-gray-500">
                        Cantidad: {item.cantidad} bultos
                      </div>
                    </div>
                    <div class="text-right font-semibold">
                      {formatearPrecio(item.subtotal)}
                    </div>
                  </div>
                </div>
              )}
            </For>

            <hr class="my-2" />

            <div class="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>{formatearPrecio(pedido.total)}</span>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <Show when={puedeCancelar}>
              <button
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                onClick={() => setShowConfirm(true)}
                disabled={duplicando() || showConfirm()}
              >
                Cancelar Pedido
              </button>
            </Show>

            <Show when={puedeModificar}>
              <button
                class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                onClick={modificarPedido}
                disabled={duplicando() || showConfirm()}
              >
                Modificar
              </button>
            </Show>

            <button
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              onClick={handleDuplicarPedido}
              disabled={duplicando() || showConfirm()}
            >
              Duplicar Pedido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
