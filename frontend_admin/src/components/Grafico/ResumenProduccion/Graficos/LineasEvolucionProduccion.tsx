import { Line } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { EvolucionProduccion } from "@/types/grafico";

interface Props {
  datos: EvolucionProduccion[];
  modo: "cantidad" | "valor";
}

function parsePeriodo(periodo: string): number {
  if (periodo.startsWith("Semana ")) {
    const [_, wk] = periodo.split("Semana ");
    const [week, year] = wk.split("/").map(Number);
    return new Date(year, 0, 1 + (week - 1) * 7).getTime();
  }
  const parts = periodo.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day).getTime();
  }
  if (parts.length === 2) {
    const [month, year] = parts.map(Number);
    return new Date(year, month - 1, 1).getTime();
  }
  return Date.parse(periodo);
}

export default function LineasEvolucionProduccion({ datos, modo }: Props) {
  if (!datos.length) return null;

  const sorted = [...datos].sort((a, b) =>
    parsePeriodo(a.periodo) - parsePeriodo(b.periodo)
  );

  const labels = sorted.map(e => e.periodo);
  const valores = sorted.map(e => modo === "cantidad" ? e.totalCantidad : e.totalValor);
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Evolución de Producción
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Line
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: modo === "cantidad" ? "Cantidad producida" : "Valor producido",
                  data: valores,
                  fill: false,
                  tension: 0.3,
                  borderColor: "#4f46e5",
                  backgroundColor: "#c7d2fe"
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                x: {
                  ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 }
                },
                y: {
                  beginAtZero: true
                }
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
