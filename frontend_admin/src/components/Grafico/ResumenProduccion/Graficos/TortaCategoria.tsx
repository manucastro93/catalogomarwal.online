import { Pie } from "solid-chartjs";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart as ChartJS } from "chart.js";
import type { ResumenProduccionCategoria } from "@/types/grafico";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
// Registramos el plugin
ChartJS.register(ChartDataLabels);

interface Props {
  datos: ResumenProduccionCategoria[];
  modo: "cantidad" | "valor";
}

export default function TortaCategoria({ datos, modo }: Props) {
  if (!datos?.length) return null;

  const labels = datos.map(r => r.categoria);
  const valores = datos.map(r => modo === "cantidad" ? r.totalCantidad : r.totalValor);
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Producción por Categoría
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Pie
            key={key}
            data={{
              labels,
              datasets: [
                {
                  data: valores,
                  backgroundColor: [
                    "#8884d8", "#82ca9d", "#ffc658", "#ff8042",
                    "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb"
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    font: { size: 12 },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const label = context.label || "";
                      const value = context.raw || 0;
                      if (modo === "valor") {
                        return `${label}: ${formatearPrecio(value)}`;
                      } else {
                        return `${label}: ${formatearMiles(value)}`;
                      }
                    }
                  }
                },
                datalabels: {
                  color: "#333",
                  font: {
                    weight: "bold" as const,
                    size: 12
                  },
                  formatter: (value: number, context: any) => {
                    const label = context.chart.data.labels?.[context.dataIndex] || "";
                    if (modo === "valor") {
                      return `${label} - ${formatearPrecio(value)}`;
                    } else {
                      return `${label} - ${formatearMiles(value)}`;
                    }
                  },
                  anchor: "end",
                  align: "start",
                  offset: 10,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
