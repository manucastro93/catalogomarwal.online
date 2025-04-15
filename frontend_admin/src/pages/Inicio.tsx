import { createResource, For, createEffect } from 'solid-js';
import { obtenerResumenDelMes } from '../services/estadisticas.service';

export default function Inicio() {
  const [resumen] = createResource(obtenerResumenDelMes);
  createEffect(() => {
    if (resumen()) {
      console.log('📊 Resumen cargado:', resumen());
    }
  });
  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Resumen del mes</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Pedidos del mes</h2>
          <p class="text-3xl">{resumen()?.pedidosDelMes ?? '...'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Producto estrella</h2>
          <p>{resumen()?.productoEstrella?.Producto?.nombre ?? 'Sin datos'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Vendedor top</h2>
          <p>{resumen()?.vendedorTop?.nombre ?? 'Sin datos'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="font-semibold text-gray-700">Categoría más vendida</h2>
          <p>{resumen()?.categoriaTop?.nombre ?? 'Sin datos'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow col-span-full">
          <h2 class="font-semibold text-gray-700 mb-2">Top 5 Clientes</h2>
          <ul class="list-disc list-inside">
            <For each={resumen()?.mejoresClientes ?? []}>
              {(cliente) => (
                <li>{cliente.nombre} — ${cliente.totalGastado?.toFixed(2)}</li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </div>
  );
}
