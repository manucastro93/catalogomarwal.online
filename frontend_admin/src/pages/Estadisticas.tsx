import { createResource, Show, For } from 'solid-js';
import {
  obtenerResumenDelMes,
  obtenerEstadisticasPorFecha,
  compararRangos,
  obtenerRankingEstadisticas
} from '../services/estadisticas.service';
import { formatearPrecio } from '../utils/formato';
import GraficoEstadisticasPorFecha from '../components/GraficoEstadisticasPorFecha';
import ComparadorDeRangos from '../components/ComparadorDeRangos';
import RankingEstadisticas from '../components/RankingEstadisticas';

export default function Estadisticas() {
  const [resumen] = createResource(obtenerResumenDelMes);

  return (
    <div class="p-6 space-y-6">
      <h1 class="text-2xl font-bold">Estadísticas del mes</h1>

      <Show when={resumen()} fallback={<p>Cargando estadísticas...</p>}>
        <div class="grid md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded shadow">
            <p class="text-gray-500 text-sm">Total de pedidos</p>
            <p class="text-2xl font-bold">{resumen().totalPedidos}</p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-gray-500 text-sm">Total facturado</p>
            <p class="text-2xl font-bold">{formatearPrecio(resumen().totalFacturado || 0)}</p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-gray-500 text-sm">Producto más vendido</p>
            <p class="text-lg font-semibold">
              {resumen().productoEstrella?.Producto?.nombre || '—'}
            </p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-gray-500 text-sm">Vendedor con más ventas</p>
            <p class="text-lg font-semibold">
              {resumen().vendedorTop?.usuario?.nombre || '—'}
            </p>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <p class="text-gray-500 text-sm">Categoría más vendida</p>
            <p class="text-lg font-semibold">
              {resumen().categoriaTop?.nombre || '—'}
            </p>
          </div>

          <div class="bg-white p-4 rounded shadow md:col-span-3">
            <p class="text-gray-500 text-sm mb-2">Top 5 clientes del mes</p>
            <For each={resumen().mejoresClientes}>
              {(cliente) => (
                <div class="flex justify-between border-b py-1 text-sm">
                  <span>{cliente.cliente?.nombre || cliente.nombre || '—'}</span>
                  <span>{formatearPrecio(cliente.totalGastado)}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <GraficoEstadisticasPorFecha />
      <ComparadorDeRangos />
      <RankingEstadisticas />
    </div>
  );
}
