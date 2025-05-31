import { Line } from "solid-chartjs";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
} from "chart.js";
import type { ChartData } from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function LineaLeadTime({ datos }: { datos: { fecha: string; leadTime: number }[] }) {
  const chartData: ChartData<"line"> = {
    labels: datos.map((d) => d.fecha),
    datasets: [
      {
        label: "Lead Time (días)",
        data: datos.map((d) => d.leadTime),
        fill: false,
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
        tension: 0.2,
      },
    ],
  };

  return (
    <div class="bg-white p-4 rounded shadow-md">
      <h2 class="text-lg font-semibold mb-2">Evolución del Lead Time</h2>
      <Line data={chartData} />
    </div>
  );
}
