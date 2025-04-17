import { createSignal, createResource, Show, For } from 'solid-js';
import dayjs from 'dayjs';
import api from '../services/api';
import { formatearPrecio } from '../utils/formato';

export default function ComparadorDeRangos() {
  const hoy = dayjs();
  const hace30 = hoy.subtract(30, 'day');
  const hace60 = hoy.subtract(60, 'day');
  const hace31 = hoy.subtract(31, 'day');

  const [desde1, setDesde1] = createSignal(hace60.format('YYYY-MM-DD'));
  const [hasta1, setHasta1] = createSignal(hace31.format('YYYY-MM-DD'));
  const [desde2, setDesde2] = createSignal(hace30.format('YYYY-MM-DD'));
  const [hasta2, setHasta2] = createSignal(hoy.format('YYYY-MM-DD'));

  const [comparacion] = createResource(() => [desde1(), hasta1(), desde2(), hasta2()],
    ([d1, h1, d2, h2]) =>
      api.get('/estadisticas/comparar-rangos', { params: { desde1: d1, hasta1: h1, desde2: d2, hasta2: h2 } }).then(r => r.data)
  );

  return (
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Comparar dos rangos de fechas</h2>

      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <p class="font-semibold mb-2">Rango 1</p>
          <input type="date" value={desde1()} onInput={(e) => setDesde1(e.currentTarget.value)} class="border rounded px-2 py-1 mr-2" />
          <input type="date" value={hasta1()} onInput={(e) => setHasta1(e.currentTarget.value)} class="border rounded px-2 py-1" />
        </div>

        <div>
          <p class="font-semibold mb-2">Rango 2</p>
          <input type="date" value={desde2()} onInput={(e) => setDesde2(e.currentTarget.value)} class="border rounded px-2 py-1 mr-2" />
          <input type="date" value={hasta2()} onInput={(e) => setHasta2(e.currentTarget.value)} class="border rounded px-2 py-1" />
        </div>
      </div>

      <Show when={comparacion()} fallback={<p>Cargando comparación...</p>}>
        <div class="grid md:grid-cols-2 gap-6">
          <For each={[comparacion().rango1, comparacion().rango2]}> 
            {(r, i) => (
              <div class="bg-white p-4 rounded shadow">
                <p class="text-sm text-gray-500 mb-2 font-semibold">Rango {i() + 1}</p>
                <p class="text-sm">Total pedidos: <span class="font-bold">{r.totalPedidos}</span></p>
                <p class="text-sm">Facturación: <span class="font-bold">{formatearPrecio(r.totalFacturado)}</span></p>
                <p class="text-sm">Producto más vendido:</p>
                <p class="text-base font-semibold">
                  {r.productoTop?.Producto?.nombre || '—'} ({r.productoTop?.cantidad || 0})
                </p>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
