import { Show, For } from 'solid-js';
import { formatearPrecio } from '@/utils/formato';
import type { ResumenEstadisticas } from '@/types/estadistica'; // si tenés definido

export default function ResumenEstadisticasMensuales(props: {
  resumen: ResumenEstadisticas;
}) {
  const { resumen } = props;

  return (
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Total de pedidos</p>
        <p class="text-2xl font-bold">{resumen.totalPedidos}</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Total facturado</p>
        <p class="text-2xl font-bold">{formatearPrecio(resumen.totalFacturado || 0)}</p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Producto más vendido</p>
        <p class="text-lg font-semibold">
          {resumen.productoEstrella?.Producto?.nombre || '—'}
        </p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Vendedor con más ventas</p>
        <p class="text-lg font-semibold">
          {resumen.vendedorTop?.usuario?.nombre || '—'}
        </p>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <p class="text-gray-500 text-sm">Categoría más vendida</p>
        <p class="text-lg font-semibold">
          {resumen.categoriaTop?.nombre || '—'}
        </p>
      </div>

      <div class="bg-white p-4 rounded shadow md:col-span-3">
        <p class="text-gray-500 text-sm mb-2">Top 5 clientes del mes</p>
        <For each={resumen.mejoresClientes}>
          {(cliente) => (
            <div class="flex justify-between border-b py-1 text-sm">
              <span>{cliente.cliente?.nombre || '—'}</span>
              <span>{formatearPrecio(cliente.totalGastado)}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
