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

export default function ClienteLeadTime({ datos }: { datos: EficienciaCliente[] }) {
  if (!datos.length) return null;

  const agrupado: Record<string, string[]> = {};
  for (const r of datos) {
    const key =
      typeof r.leadTimePromedio === "number" && !isNaN(r.leadTimePromedio)
        ? r.leadTimePromedio.toFixed(2)
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
        Lead Time por Cliente
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
                  backgroundColor: "rgba(153, 102, 255, 0.5)",
                  borderColor: "rgba(153, 102, 255, 1)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  title: { display: true, text: "Lead Time (días) agrupado" },
                },
                y: {
                  beginAtZero: true,
                  title: { display: true, text: "Lead Time (días)" },
                  ticks: { precision: 0 },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (ctx:any) => `Lead Time: ${ctx[0].label} días`,
                    afterLabel: (ctx:any) => {
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
