import { createResource, For, Show } from 'solid-js';
import { obtenerResumenDelMes } from '../services/estadisticas.service';
import { formatearPrecio } from '../utils/formato';

export default function Inicio() {
  const [resumen] = createResource(obtenerResumenDelMes);
  console.log(obtenerResumenDelMes());
  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Resumen del mes</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Pedidos del mes</h2>
          <p class="text-3xl">{resumen()?.totalPedidos ?? '...'}</p>
          <p class="text-sm text-gray-500">{formatearPrecio(Number(resumen()?.totalFacturado ?? 0))} facturado</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Producto estrella del mes</h2>
          <Show when={resumen()?.productoEstrella} fallback={<p>Sin datos</p>}>
            <div class="flex items-center gap-3">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${resumen().productoEstrella.Producto?.imagenUrl}`}
                alt={resumen().productoEstrella.Producto?.nombre}
                class="w-20 h-20 object-contain rounded"
              />
              <div>
                <p class="font-semibold">{resumen().productoEstrella.Producto?.nombre}</p>
                <p class="text-xs text-gray-500">
                  {resumen().productoEstrella.totalVendidas} bultos — {formatearPrecio(Number(resumen().productoEstrella.totalFacturado))}
                </p>
              </div>
            </div>
          </Show>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Vendedor top del mes</h2>
          <Show when={resumen()?.vendedorTop} fallback={<p>Sin datos</p>}>
            <div>
              <p class="font-semibold">{resumen().vendedorTop.usuario?.nombre}</p>
              <p class="text-xs text-gray-500">
                {resumen().vendedorTop.cantidad} pedidos — {formatearPrecio(Number(resumen().vendedorTop.totalFacturado))}
              </p>
            </div>
          </Show>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Categoría más vendida del mes</h2>
          <p>{resumen()?.categoriaTop?.nombre ?? 'Sin datos'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow col-span-full">
          <h2 class="font-semibold text-gray-700 mb-2">Top 5 Clientes del mes</h2>
          <ul class="list-disc list-inside">
            <For each={resumen()?.mejoresClientes ?? []}>
              {(cliente) => (
                <li>{cliente.cliente?.nombre ?? cliente.nombre} — {formatearPrecio(Number(cliente.totalGastado))}</li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </div>
  );
}
