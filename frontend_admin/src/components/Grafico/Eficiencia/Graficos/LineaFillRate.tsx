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
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LineaFillRate({ datos }: { datos: { fecha: string; fillRate: number }[] }) {
  const chartData: ChartData<"line"> = {
    labels: datos.map((d) => d.fecha),
    datasets: [
      {
        label: "Fill Rate diario (%)",
        data: datos.map((d) => d.fillRate),
        borderColor: "#10b981", // verde
        backgroundColor: "#6ee7b7",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 },
      },
    },
  };

  return (
    <div class="bg-white p-4 rounded shadow-md">
      <h2 class="text-lg font-semibold mb-3">Evolución del Fill Rate</h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
