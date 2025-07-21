import { createMemo, Show } from "solid-js";
import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function GraficoBarras(props: {
  data: { mes: string; cantidad: number }[];
}) {
  // 🔍 Filtrar outliers (meses con carga histórica masiva)
  const datosFiltrados = createMemo(() => {
    const valores = props.data.map((d) => d.cantidad);
    const valoresOrdenados = [...valores].sort((a, b) => a - b);
    const mediana = valoresOrdenados.length > 0
      ? valoresOrdenados[Math.floor(valoresOrdenados.length / 2)]
      : 0;

    return props.data.filter((d) => d.cantidad <= mediana * 2);
  });

  const chartData = createMemo(() => ({
    labels: datosFiltrados().map((d) => d.mes),
    datasets: [
      {
        label: "Clientes creados",
        data: datosFiltrados().map((d) => d.cantidad),
        backgroundColor: "#2563eb",
      },
    ],
  }));

  return (
    <Show when={datosFiltrados().length}>
      <div class="w-full h-[280px]">
        <Bar
          data={chartData()}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </div>
    </Show>
  );
}
