import { Bar } from "solid-chartjs";
import type { EficienciaCliente } from "@/types/eficiencia";

export default function ClienteFillRate({ datos }: { datos: EficienciaCliente[] }) {
  if (!datos.length) return null;

  const datosValidos = datos.filter(d => typeof d.fillRate === "number" && !isNaN(d.fillRate));
  if (!datosValidos.length) return null;

  const labels = datosValidos.map((r) => r.cliente);
  const valores = datosValidos.map((r) => r.fillRate);
  const key = "fillrate_cliente_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Fill Rate por Cliente
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: "% de Fill Rate",
                  data: valores,
                  backgroundColor: "rgba(75, 192, 192, 0.5)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                y: { beginAtZero: true, max: 100 },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => `${context.label}: ${context.raw.toFixed(2)}%`,
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
