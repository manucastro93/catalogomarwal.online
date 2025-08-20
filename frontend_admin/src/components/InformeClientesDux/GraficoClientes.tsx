// GraficoClientes.tsx
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

export default function GraficoClientes(props: { data: any[] }) {
  const rows = createMemo(() => props.data ?? []);

  const datosFiltrados = createMemo(() => {
    const vals = rows().map((d) => d.total ?? 0).sort((a, b) => a - b);
    const mediana = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    // opcional: filtrá outliers muy grandes
    return rows().filter((d) => (d.total ?? 0) <= (mediana || 1) * 2);
  });

  const suggestedMax = createMemo(() => {
    const vals = datosFiltrados().map((d) => d.total ?? 0).sort((a, b) => a - b);
    const mediana = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    const mx = Math.max(...vals, 0);
    return Math.ceil((mediana ? mediana * 2 : mx) || 10);
  });

  const hayVendedor = createMemo(() =>
    datosFiltrados().some((d) => (d.vendedor ?? 0) > 0)
  );

  const chartData = createMemo(() => ({
    labels: datosFiltrados().map((d) => d.mes),
    datasets: [
      {
        label: "Clientes Nuevos",
        data: datosFiltrados().map((d) => d.total ?? 0),
        backgroundColor: "#2563eb",
      },
      ...(hayVendedor()
        ? [
            {
              label: "Clientes Nuevos (Vendedor)",
              data: datosFiltrados().map((d) => d.vendedor ?? 0),
              backgroundColor: "#f97316",
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
        title: { display: true, text: "Clientes" },
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
