// GraficoMontos.tsx
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

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function GraficoMontos(props: { data: any[] }) {
  const rows = createMemo(() => props.data ?? []);

  // escala amable (evita que un outlier dispare el eje)
  const suggestedMax = createMemo(() => {
    const vals = rows()
      .map((d) => Number(d.montoTotal ?? 0))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const mediana = vals.length ? vals[Math.floor(vals.length / 2)] : 0;
    const mx = vals.length ? vals[vals.length - 1] : 0;
    // usar ~2x mediana como techo sugerido; si no hay mediana, usar máximo
    return Math.ceil((mediana ? mediana * 2 : mx) || 10);
  });

  const hayVendedor = createMemo(() =>
    rows().some((d) => Number(d.montoVendedor ?? 0) > 0)
  );

  const chartData = createMemo(() => ({
    labels: rows().map((d) => d.mes),
    datasets: [
      {
        label: "Monto (Total)",
        data: rows().map((d) => Number(d.montoTotal ?? 0)),
        backgroundColor: "#0ea5e9",
      },
      ...(hayVendedor()
        ? [
            {
              label: "Monto (Vendedor)",
              data: rows().map((d) => Number(d.montoVendedor ?? 0)),
              backgroundColor: "#10b981",
            },
          ]
        : []),
    ],
  }));

  const options = createMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = Number(ctx.raw ?? 0);
            return ` ${ctx.dataset.label}: ${fmtARS.format(v)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax(),
        title: { display: true, text: "Monto (ARS)" },
        ticks: {
          callback: (value: any) => fmtARS.format(Number(value)),
        },
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
