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

// Registro de componentes necesarios
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function LineaLeadTime({ datos }: { datos: { fecha: string; leadTime: number }[] }) {
  const chartData: ChartData<"line"> = {
    labels: datos.map((d) => d.fecha),
    datasets: [
      {
        label: "Lead Time promedio (días)",
        data: datos.map((d) => d.leadTime),
        borderColor: "#3b82f6",
        backgroundColor: "#93c5fd",
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
          label: (context) => `${context.parsed.y} días`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div class="bg-white p-4 rounded shadow-md">
      <h2 class="text-lg font-semibold mb-3">Evolución del Lead Time</h2>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
