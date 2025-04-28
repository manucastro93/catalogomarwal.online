import { Bar } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { ResumenProduccionTurno } from "@/types/grafico";

interface Props {
  datos: ResumenProduccionTurno[];
  modo: "cantidad" | "valor";
}

export default function BarrasTurno({ datos, modo }: Props) {
  if (!datos?.length) return null;

  const labels = datos.map(r => r.turno);
  const valores = datos.map(r => modo === "cantidad" ? r.totalCantidad : r.totalValor);
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Producción por Turno
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: modo === "cantidad" ? "Cantidad" : "Valor $",
                  data: valores,
                  backgroundColor: "rgba(255, 206, 86, 0.6)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } }
              },
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    font: { size: 12 }
                  }
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
                  formatter: (value: number) => {
                    if (modo === "valor") {
                      return `${formatearPrecio(value)}`;
                    } else {
                      return `${formatearMiles(value)}`;
                    }
                  },
                  anchor: "end",
                  align: "start",
                  offset: 10,
                },
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
