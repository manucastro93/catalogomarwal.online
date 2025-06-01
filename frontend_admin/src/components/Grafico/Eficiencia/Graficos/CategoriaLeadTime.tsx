import { Bar } from "solid-chartjs";
import type { EficienciaCategoria } from "@/types/eficiencia";

export default function CategoriaLeadTime({ datos }: { datos: EficienciaCategoria[] }) {
  if (!datos.length) return null;

  const datosOrdenados = [...datos].sort((a, b) => {
    const aVal = typeof a.leadTimePromedio === "number" ? a.leadTimePromedio : Infinity;
    const bVal = typeof b.leadTimePromedio === "number" ? b.leadTimePromedio : Infinity;
    return aVal - bVal;
  });

  const labels = datosOrdenados.map((r) => r.categoria);
  const valores = datosOrdenados.map((r) =>
    typeof r.leadTimePromedio === "number" && !isNaN(r.leadTimePromedio) ? r.leadTimePromedio : 0
  );

  const key = "leadtime_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Lead Time por Categoría
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: "Lead Time (días)",
                  data: valores,
                  backgroundColor: "rgba(255, 159, 64, 0.5)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                y: { beginAtZero: true },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const original = datosOrdenados[context.dataIndex].leadTimePromedio;
                      return `${context.label}: ${
                        original == null || isNaN(original) ? "Sin datos" : `${original.toFixed(2)} días`
                      }`;
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

