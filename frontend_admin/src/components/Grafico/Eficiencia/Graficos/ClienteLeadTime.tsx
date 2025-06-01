import { Bar } from "solid-chartjs";
import type { EficienciaCliente } from "@/types/eficiencia";

export default function ClienteLeadTime({ datos }: { datos: EficienciaCliente[] }) {
  if (!datos.length) return null;

  const datosOrdenados = [...datos].sort((a, b) => {
    const aVal = isNaN(a.leadTimePromedio ?? 0) ? Infinity : a.leadTimePromedio!;
    const bVal = isNaN(b.leadTimePromedio ?? 0) ? Infinity : b.leadTimePromedio!;
    return aVal - bVal;
  });

  const labels = datosOrdenados.map((r) => r.cliente);
  const valores = datosOrdenados.map((r) =>
    typeof r.leadTimePromedio === "number" && !isNaN(r.leadTimePromedio)
      ? r.leadTimePromedio
      : 0
  );

  const key = "leadtime_cliente_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Lead Time por Cliente
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
                  backgroundColor: "rgba(153, 102, 255, 0.5)",
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
                        original == null || isNaN(original)
                          ? "Sin datos"
                          : `${original.toFixed(2)} días`
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
