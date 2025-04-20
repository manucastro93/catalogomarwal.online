import { For, Show } from "solid-js";
import { formatearPrecio } from "../../utils/formato";
import type { ResumenEstadisticas } from "../../types/estadistica"; // ajustalo si lo tenés

export default function ResumenInicioMensual(props: {
  resumen: ResumenEstadisticas;
}) {
  const { resumen } = props;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-gray-700">Pedidos del mes</h2>
        <p class="text-3xl">{resumen.totalPedidos ?? "..."}</p>
        <p class="text-sm text-gray-500">
          {formatearPrecio(resumen.totalFacturado ?? 0)} facturado
        </p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-gray-700">Producto estrella del mes</h2>
        <Show when={resumen.productoEstrella} fallback={<p>Sin datos</p>}>
          <div class="flex items-center gap-3">
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${
                resumen.productoEstrella?.Producto?.imagenUrl
              }`}
              alt={resumen.productoEstrella?.Producto?.nombre}
              class="w-20 h-20 object-contain rounded"
            />
            <div>
              <p class="font-semibold">
                {resumen.productoEstrella?.Producto?.nombre}
              </p>
              <p class="text-xs text-gray-500">
                {resumen.productoEstrella?.totalVendidas} bultos —{" "}
                {formatearPrecio(resumen.productoEstrella?.totalFacturado ?? 0)}
              </p>
            </div>
          </div>
        </Show>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-gray-700">Vendedor top del mes</h2>
        <Show when={resumen.vendedorTop}>
          {(vendedorTop) => (
            <div>
              <p class="font-semibold">{vendedorTop().usuario?.nombre}</p>
              <p class="text-xs text-gray-500">
                {vendedorTop().cantidad} pedidos —{" "}
                {formatearPrecio(vendedorTop().totalFacturado ?? 0)}
              </p>
            </div>
          )}
        </Show>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-gray-700">
          Categoría más vendida del mes
        </h2>
        <p>{resumen.categoriaTop?.nombre ?? "Sin datos"}</p>
      </div>

      <div class="bg-white p-4 rounded shadow col-span-full">
        <h2 class="font-semibold text-gray-700 mb-2">Top 5 Clientes del mes</h2>
        <ul class="list-disc list-inside">
          <For each={resumen.mejoresClientes ?? []}>
            {(cliente) => (
              <li>
                {cliente.cliente?.nombre ?? "—"} —{" "}
                {formatearPrecio(cliente.totalGastado)}
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  );
}
