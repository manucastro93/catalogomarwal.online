import { Bar } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { ClienteRanking } from "@/types/estadistica";

interface Props {
  datos: ClienteRanking[];
  modo: "cantidad" | "valor";
}

export default function BarrasCliente({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((c) => c.cliente.nombre);
  const valores = datos.map((c) =>
    modo === "cantidad" ? c.cantidadPedidos : c.totalGastado
  );
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Ventas por Cliente
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
                  backgroundColor: "rgba(34, 197, 94, 0.5)",
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
                legend: { position: "bottom" },
                tooltip: {
                  callbacks: {
                    label: (context: any) =>
                      modo === "valor"
                        ? formatearPrecio(context.raw)
                        : formatearMiles(context.raw),
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
