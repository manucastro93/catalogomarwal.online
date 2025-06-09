import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { EficienciaMensual } from "@/types/eficiencia";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Props {
  datos: EficienciaMensual[];
}

export default function ClienteFillRateMensual({ datos }: Props) {
  if (!datos?.length) return null;

  const labels = datos.map((d) => d.mes);
  const valores = datos.map((d) => d.fillRate || 0);
  const maxValor = Math.max(...valores, 1);

  // Fill rate más alto = color más fuerte
  const colores = valores.map((v) => {
    const lightness = (v / maxValor) * 50;
    return `hsl(170, 70%, ${lightness}%)`; // verde azulado
  });

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Evolución Mensual del Fill Rate
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Fill Rate (%)",
                  data: valores,
                  backgroundColor: colores,
                  borderColor: "#008080", // verde oscuro fijo
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: "Fill Rate (%)" },
                  ticks: { precision: 0 },
                },
                x: {
                  title: { display: true, text: "Mes" },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => `${context.parsed.y}%`,
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
