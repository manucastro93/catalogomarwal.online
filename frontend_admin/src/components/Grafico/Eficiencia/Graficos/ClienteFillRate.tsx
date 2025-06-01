import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { EficienciaCliente } from "@/types/eficiencia";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ClienteFillRate({ datos }: { datos: EficienciaCliente[] }) {
  if (!datos.length) return null;

  const agrupado: Record<string, string[]> = {};
  for (const r of datos) {
    const key =
      typeof r.fillRate === "number" && !isNaN(r.fillRate)
        ? r.fillRate.toFixed(2)
        : "Sin datos";
    if (!agrupado[key]) agrupado[key] = [];
    agrupado[key].push(r.cliente);
  }

  const labels = Object.keys(agrupado)
    .filter((k) => k !== "Sin datos")
    .sort((a, b) => parseFloat(a) - parseFloat(b));

  const valores = labels.map((k) => parseFloat(k));

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Fill Rate por Cliente
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
                  backgroundColor: "rgba(75, 192, 192, 0.5)",
                  borderColor: "rgba(75, 192, 192, 1)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  title: { display: true, text: "Fill Rate (%) agrupado" },
                },
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: "Fill Rate (%)" },
                  ticks: { precision: 0 },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (ctx: any) => `Fill Rate: ${ctx[0].label}%`,
                    afterLabel: (ctx: any) => {
                      const valor = ctx.label;
                      const clientes = agrupado[valor] || [];
                      return clientes;
                    },
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
