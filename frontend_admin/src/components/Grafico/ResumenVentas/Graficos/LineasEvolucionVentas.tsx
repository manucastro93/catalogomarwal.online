import { Line } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { PuntoEstadistica } from "@/types/estadistica";

interface Props {
  datos: PuntoEstadistica[];
  modo: "cantidad" | "valor";
}

export default function LineasEvolucionVentas({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((p) => p.fecha);
  const valores = datos.map((p) =>
    modo === "cantidad" ? p.cantidad : p.total
  );
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Evolución de Ventas
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Line
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: modo === "cantidad" ? "Pedidos" : "Facturado",
                  data: valores,
                  borderColor: "#6366f1",
                  backgroundColor: "rgba(99,102,241,0.3)",
                  tension: 0.4,
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
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
