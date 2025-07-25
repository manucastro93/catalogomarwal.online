import { createMemo, Show } from "solid-js";
import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

export default function GraficoBarras(props: {
  data: { mes: string; total: number; vendedor?: number }[];
}) {
  const datosFiltrados = createMemo(() => {
    const valores = props.data.map((d) => d.total);
    const ordenados = [...valores].sort((a, b) => a - b);
    const mediana = ordenados.length > 0 ? ordenados[Math.floor(ordenados.length / 2)] : 0;

    return props.data.filter((d) => d.total <= mediana * 2);
  });

  const chartData = createMemo(() => {
    const labels = datosFiltrados().map((d) => d.mes);

    const datasetTotal = {
      label: "Total",
      data: datosFiltrados().map((d) => d.total),
      backgroundColor: "#2563eb",
    };

    const contieneVendedor = datosFiltrados().some((d) => typeof d.vendedor === "number");

    const datasetVendedor = {
      label: "Vendedor seleccionado",
      data: datosFiltrados().map((d) => d.vendedor ?? 0),
      backgroundColor: "#f97316",
    };

    return {
      labels,
      datasets: contieneVendedor ? [datasetTotal, datasetVendedor] : [datasetTotal],
    };
  });

  return (
    <Show when={datosFiltrados().length}>
      <div class="w-full h-[280px]">
        <Bar
          data={chartData()}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
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

