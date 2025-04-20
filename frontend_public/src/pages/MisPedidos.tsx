import { createResource, For, Show, createSignal } from "solid-js";
import { obtenerMisPedidos } from "../services/pedido.service";
import { obtenerBanners } from "../services/pagina.service";
import { cancelarPedido as cancelarPedidoAPI } from "../services/pedido.service"; 
import dayjs from "dayjs";
import ModalPedido from "../components/ModalPedido"; 
import ModalMensaje from "../components/ModalMensaje";
import { formatearPrecio } from "../utils/formato"; 

export default function MisPedidos() {
  const [banners] = createResource(obtenerBanners);
  const [pedidos, { refetch }] = createResource(obtenerMisPedidos);
  const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<any | null>(null);
  const [mensaje, setMensaje] = createSignal("");


  const cancelarPedido = async () => {
    try {
      const id = pedidoSeleccionado().id;  
      await cancelarPedidoAPI(id);
      setMensaje("✅ Pedido cancelado correctamente");
      setPedidoSeleccionado(null);
      setTimeout(() => setMensaje(""), 5000);
      refetch();
    } catch (err: any) {
      console.error("❌ Error al cancelar el pedido:", err);
      setMensaje(err?.message || "No se pudo cancelar el pedido.");
      setTimeout(() => setMensaje(""), 5000);

    }
  };
  

  const modificarPedido = () => {
    const pedido = pedidoSeleccionado();
    if (!pedido) return;
  
    // Armar carrito desde detalles
    const carrito = pedido.detalles.map((item: any) => ({
      id: item.productoId,
      nombre: item.Producto?.nombre,
      cantidad: item.cantidad,
      precio: item.precioXBulto,
      unidadPorBulto: item.Producto?.unidadPorBulto || 1,
      imagen: item.Producto?.Imagenes?.[0]?.url || "",
    }));
  
    // Guardar en localStorage
    localStorage.setItem("carrito", JSON.stringify(carrito));
    localStorage.setItem("modoEdicionPedidoId", String(pedido.id));
  
    // Redirigir al home (inicio)
    window.location.href = "/";
  };
  

  return (
    <div class="flex flex-col">
      {/* Banner */}
      <Show when={banners()}>
        <div class="w-full overflow-hidden mb-0">
          <For each={banners()}>
            {(banner) => (
              <img
                src={`${import.meta.env.VITE_UPLOADS_URL}${banner.imagen}`}
                alt="Banner"
                class="w-full object-cover max-h-[800px]"
              />
            )}
          </For>
        </div>
      </Show>

      <div class="w-full px-6 py-8">
      <h1 class="text-xl font-bold mb-6 text-center">Mis Pedidos</h1>

        <Show when={pedidos.loading}>
          <p class="text-center">Cargando pedidos...</p>
        </Show>

        <Show when={pedidos.error}>
          <p class="text-center text-red-600">Error al obtener pedidos</p>
        </Show>

        <Show
          when={pedidos() && pedidos().length > 0}
          fallback={<p class="text-center">No se encontraron pedidos asociados a tu IP.</p>}
        >
          <div class="space-y-6">
            <For each={pedidos()}>
              {(pedido) => (
                <div
                  class="border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 w-full"
                  onClick={() => setPedidoSeleccionado(pedido)}
                >
                  <div class="flex justify-between items-center mb-2">
                    <p class="font-bold">Pedido #{pedido.id}</p>
                    <p class="text-sm text-gray-500">
                      {dayjs(pedido.createdAt).format("DD/MM/YYYY HH:mm")}
                    </p>
                  </div>

                  <div class="space-y-1 text-sm text-gray-700">
                    <For each={pedido.detalles}>
                      {(detalle) => (
                        <div class="flex justify-between">
                          <span>{detalle.Producto?.nombre || "Producto"} x {detalle.cantidad}</span>
                          <span>{formatearPrecio(detalle.subtotal)}</span>
                        </div>
                      )}
                    </For>
                  </div>

                  <div class="flex justify-between mt-2 font-semibold text-sm">
                    <span>Total:</span>
                    <span>{formatearPrecio(pedido.total)}</span>
                  </div>

                  <p class="mt-1 text-xs text-gray-500">Estado: {pedido.estado}</p>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={mensaje()}>
  <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
</Show>
      <Show when={pedidoSeleccionado()}>
        <ModalPedido
          pedido={pedidoSeleccionado()}
          onCerrar={() => setPedidoSeleccionado(null)}
          onCancelar={cancelarPedido}
          onModificar={modificarPedido}
        />
      </Show>
    </div>
  );
}
