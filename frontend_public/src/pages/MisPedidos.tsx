// src/pages/MisPedidos.tsx
import { createResource, For, Show, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { obtenerMisPedidos } from "../services/pedido.service";
import { obtenerBanners } from "../services/pagina.service";
import ModalPedido from "../components/ModalPedido";
import ModalMensaje from "../components/ModalMensaje";
import { formatearPrecio } from "../utils/formato";
import dayjs from "dayjs";

export default function MisPedidos() {
  const [banners] = createResource(obtenerBanners);
  const [pedidos, { refetch }] = createResource(obtenerMisPedidos);
  const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<any | null>(null);
  const [mensaje, setMensaje] = createSignal("");
  const navigate = useNavigate();

  return (
    <div class="flex flex-col">
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
        <h1 class="text-2xl font-bold mb-2 text-center">Mis Pedidos</h1>
        <div class="flex justify-center mb-6">
          <button
            class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
            onClick={() => navigate("/")}
          >
            ⬅ Volver al inicio
          </button>
        </div>
        <Show when={pedidos.loading}>
          <p class="text-center">Cargando pedidos...</p>
        </Show>

        <Show when={pedidos.error}>
          <p class="text-center text-red-600">Error al obtener pedidos</p>
        </Show>

        <Show
          when={(pedidos()?.length ?? 0) > 0}
          fallback={<p class="text-center">No se encontraron pedidos asociados a tu IP.</p>}
        >
          <div class="flex flex-col items-center gap-6">
            <For each={pedidos()}>
              {(pedido) => (
                <div class="w-full max-w-xl">
                  <div
                    classList={{
                      "border rounded-xl p-6 shadow-md hover:shadow-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 w-full": true,
                      "bg-yellow-100": pedido.estado === "pendiente",
                      "bg-blue-100": pedido.estado === "confirmado" || pedido.estado === "enviado",
                      "bg-indigo-100": pedido.estado === "preparando",
                      "bg-green-100": pedido.estado === "entregado",
                      "bg-red-100": pedido.estado === "cancelado" || pedido.estado === "rechazado",
                    }}
                    onClick={() => setPedidoSeleccionado(pedido)}
                  >
                    <div class="flex justify-between items-center mb-2">
                      <p class="font-bold text-2xl">Pedido #{pedido.id}</p>
                      <p class="text-sm text-gray-500">
                        {dayjs(pedido.createdAt).format("DD/MM/YYYY HH:mm")}
                      </p>
                    </div>
                    <div class="flex justify-between mt-2 font-semibold text-xl">
                      <span>Total:</span>
                      <span>{formatearPrecio(pedido.total)}</span>
                    </div>
                    <p class="mt-1 text-base font-semibold text-gray-700">
                      Estado: <span class="capitalize">{pedido.estado}</span>
                    </p>
                  </div>
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
          pedido={pedidoSeleccionado()!}
          onCerrar={() => setPedidoSeleccionado(null)}
          onDuplicado={() => {
            refetch();
            setPedidoSeleccionado(null);
          }}
          setMensaje={setMensaje}
        />
      </Show>
    </div>
  );
}
