// GraficoPedidos.tsx
import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { createMemo, Show } from "solid-js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function GraficoPedidos(props: { data: any[] }) {
  const rows = createMemo(() => props.data ?? []);

  const suggestedMax = createMemo(() => {
    const vals = rows().map((d) => d.pedidosTotal ?? 0).sort((a, b) => a - b);
    const mediana = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    const mx = Math.max(...vals, 0);
    return Math.ceil((mediana ? mediana * 1.8 : mx) || 10);
  });

  const hayVendedor = createMemo(() =>
    rows().some((d) => (d.pedidosVendedor ?? 0) > 0)
  );

  const chartData = createMemo(() => ({
    labels: rows().map((d) => d.mes),
    datasets: [
      {
        label: "Pedidos (Total)",
        data: rows().map((d) => d.pedidosTotal ?? 0),
        backgroundColor: "#8b5cf6",
      },
      ...(hayVendedor()
        ? [
            {
              label: "Pedidos (Vendedor)",
              data: rows().map((d) => d.pedidosVendedor ?? 0),
              backgroundColor: "#ec4899",
            },
          ]
        : []),
    ],
  }));

  const options = createMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax(),
        title: { display: true, text: "Pedidos" },
      },
      x: { ticks: { maxRotation: 0, autoSkip: true } },
    },
  }));

  return (
    <Show when={rows().length}>
      <div class="w-full h-[360px]">
        <Bar data={chartData()} options={options()} />
      </div>
    </Show>
  );
}
