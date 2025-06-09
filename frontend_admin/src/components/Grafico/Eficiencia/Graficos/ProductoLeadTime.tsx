import { Bar } from "solid-chartjs";
import type { EficienciaProducto } from "@/types/eficiencia";

export default function ProductoLeadTime({ datos }: { datos: EficienciaProducto[] }) {
  if (!datos.length) return null;

  // Ordenar los datos por leadTimePromedio ascendente
  const datosOrdenados = [...datos].sort((a, b) => a.leadTimePromedio - b.leadTimePromedio);

  const labels = datosOrdenados.map(d => d.producto);
  const valores = datosOrdenados.map(d => d.leadTimePromedio);

  const key = "leadtime_prod_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Lead Time por Producto
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
                  backgroundColor: "rgba(255, 206, 86, 0.5)",
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
                    label: (context: any) => `${context.label}: ${context.raw} días`,
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
