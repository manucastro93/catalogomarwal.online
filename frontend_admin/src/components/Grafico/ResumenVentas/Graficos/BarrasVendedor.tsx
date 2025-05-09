import { Bar } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { VendedorRanking } from "@/types/estadistica";

interface Props {
  datos: VendedorRanking[];
  modo: "cantidad" | "valor";
}

export default function BarrasVendedor({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((v) => v.usuario.nombre);
  const valores = datos.map((v) =>
    modo === "cantidad" ? v.totalPedidos : v.totalFacturado
  );
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Ventas por Vendedor
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: modo === "cantidad" ? "Pedidos" : "Facturado",
                  data: valores,
                  backgroundColor: "rgba(99, 102, 241, 0.5)",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } },
              },
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { font: { size: 12 } },
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const value = context.raw || 0;
                      return modo === "valor"
                        ? formatearPrecio(value)
                        : formatearMiles(value);
                    },
                  },
                },
                datalabels: {
                  color: "#333",
                  font: { weight: "bold", size: 12 },
                  formatter: (value: number) =>
                    modo === "valor"
                      ? formatearPrecio(value)
                      : formatearMiles(value),
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
