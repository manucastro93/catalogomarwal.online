import { createMemo } from "solid-js";
import { Line } from "solid-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { formatearFechaCorta } from "@/utils/formato";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function GraficoLineas(props: {
  data: { fecha: string; cantidad: number }[];
}) {
  const chartData = createMemo(() => ({
    labels: props.data.map((d) => formatearFechaCorta(d.fecha)),
    datasets: [
      {
        label: "Clientes creados por día",
        data: props.data.map((d) => d.cantidad),
        borderColor: "#2563eb",
        backgroundColor: "#93c5fd",
        fill: true,
        tension: 0.3,
      },
    ],
  }));

  return (
    <div class="w-full h-[300px]">
      <Line
        data={chartData()}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        }}
      />
    </div>
  );
}
