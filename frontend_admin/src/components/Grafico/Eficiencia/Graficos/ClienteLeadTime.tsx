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

export default function ClienteLeadTimeMensual({ datos }: Props) {
  if (!datos?.length) return null;

  const labels = datos.map((d) => d.mes);
  const valores = datos.map((d) => d.leadTime || 0);
  const maxValor = Math.max(...valores, 1);

  // Más diferencia visual: color HSL donde lightness varía con el valor
  const colores = valores.map((v) => {
    const lightness = 110 - (v / maxValor) * 80; // de 90% (claro) a 30% (oscuro)
    return `hsl(260, 50%, ${lightness}%)`; // violeta con saturación fija
  });

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Evolución Mensual del Lead Time
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: "Lead Time (días)",
                  data: valores,
                  backgroundColor: colores,
                  borderColor: "#4b0082", // índigo oscuro para contraste
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
                  title: { display: true, text: "Días" },
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
                    label: (context: any) => `${context.parsed.y} días`,
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
