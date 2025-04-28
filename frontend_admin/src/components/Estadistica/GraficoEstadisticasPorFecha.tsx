import { createSignal, createResource, Show } from 'solid-js';
import { obtenerEstadisticasPorFecha } from '@/services/estadisticas.service';
import dayjs from 'dayjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'solid-chartjs';
import type { PuntoEstadistica } from '@/types/estadistica';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function GraficoEstadisticasPorFecha() {
  const hoy = dayjs();
  const hace30 = hoy.subtract(30, 'day');

  const [desde, setDesde] = createSignal(hace30.format('YYYY-MM-DD'));
  const [hasta, setHasta] = createSignal(hoy.format('YYYY-MM-DD'));
  const [estadisticas] = createResource(() => [desde(), hasta()], ([d, h]) => obtenerEstadisticasPorFecha(d, h));

  const buildData = () => {
    const data = estadisticas() as PuntoEstadistica[] || [];
    return {
        labels: data.map((d: { fecha: string }) => d.fecha),
      datasets: [
        {
          label: 'Total facturado',
          data: data.map((d: { total: number }) => d.total),
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
        },
        {
          label: 'Cantidad de pedidos',
          data: data.map((d: { cantidad: number }) => d.cantidad),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
        },
      ]
    };
  };

  return (
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Evolución de pedidos</h2>

      <div class="flex gap-4 items-center mb-6">
        <label class="text-sm">Desde:</label>
        <input type="date" value={desde()} onInput={(e) => setDesde(e.currentTarget.value)} class="border px-2 py-1 rounded" />
        <label class="text-sm">Hasta:</label>
        <input type="date" value={hasta()} onInput={(e) => setHasta(e.currentTarget.value)} class="border px-2 py-1 rounded" />
      </div>

      <Show when={estadisticas()} fallback={<p>Cargando gráfico...</p>}>
        <Line
          data={buildData()}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: false,
              },
            },
          }}
        />
      </Show>
    </div>
  );
}
