import { createSignal, createResource, Show, For } from 'solid-js';
import dayjs from 'dayjs';
import { obtenerRankingEstadisticas } from '../services/estadisticas.service';
import { formatearPrecio } from '../utils/formato';

export default function RankingEstadisticas() {
  const hoy = dayjs();
  const inicio = hoy.startOf('month').format('YYYY-MM-DD');
  const fin = hoy.endOf('month').format('YYYY-MM-DD');

  const [desde, setDesde] = createSignal(inicio);
  const [hasta, setHasta] = createSignal(fin);

  const [ranking] = createResource(() => [desde(), hasta()],
    ([d, h]) => obtenerRankingEstadisticas(d, h)
  );

  return (
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Ranking detallado</h2>

      <div class="flex gap-4 items-center mb-6">
        <label class="text-sm">Desde:</label>
        <input type="date" value={desde()} onInput={(e) => setDesde(e.currentTarget.value)} class="border px-2 py-1 rounded" />
        <label class="text-sm">Hasta:</label>
        <input type="date" value={hasta()} onInput={(e) => setHasta(e.currentTarget.value)} class="border px-2 py-1 rounded" />
      </div>

      <Show when={ranking()} fallback={<p>Cargando rankings...</p>}>
        <div class="grid md:grid-cols-2 gap-6">
          {/* Productos */}
          <div>
            <h3 class="font-semibold text-gray-600 mb-2">Productos más vendidos</h3>
            <For each={ranking().productos}>
              {(p) => (
                <div class="flex justify-between border-b text-sm py-1">
                  <span>{p.Producto?.nombre}</span>
                  <span>{p.cantidadVendida}u – {formatearPrecio(p.totalFacturado)}</span>
                </div>
              )}
            </For>
          </div>

          {/* Vendedores */}
          <div>
            <h3 class="font-semibold text-gray-600 mb-2">Vendedores con más ventas</h3>
            <For each={ranking().vendedores}>
              {(v) => (
                <div class="flex justify-between border-b text-sm py-1">
                  <span>{v.usuario?.nombre}</span>
                  <span>{formatearPrecio(v.totalFacturado)} ({v.totalPedidos} pedidos)</span>
                </div>
              )}
            </For>
          </div>

          {/* Clientes */}
          <div>
            <h3 class="font-semibold text-gray-600 mb-2">Clientes con más gasto</h3>
            <For each={ranking().clientes}>
              {(c) => (
                <div class="flex justify-between border-b text-sm py-1">
                  <span>{c.cliente?.nombre}</span>
                  <span>{formatearPrecio(c.totalGastado)} ({c.cantidadPedidos} pedidos)</span>
                </div>
              )}
            </For>
          </div>

          {/* Categorías */}
          <div>
            <h3 class="font-semibold text-gray-600 mb-2">Categorías más facturadas</h3>
            <For each={ranking().categorias}>
              {(cat) => (
                <div class="flex justify-between border-b text-sm py-1">
                  <span>{cat.Producto?.Categoria?.nombre || 'Sin categoría'}</span>
                  <span>{formatearPrecio(cat.totalFacturado)}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
