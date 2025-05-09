import { Pie } from "solid-chartjs";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { CategoriaRanking } from "@/types/estadistica";

interface Props {
  datos: CategoriaRanking[];
  modo: "cantidad" | "valor";
}

export default function TortaCategoriaVentas({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((c) => c.Producto.Categoria.nombre);
  const valores = datos.map((c) => c.totalFacturado); // no hay cantidad en ese ranking
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Ventas por Categoría
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Pie
            key={key}
            data={{
              labels,
              datasets: [
                {
                  label: "Facturado",
                  data: valores,
                  backgroundColor: [
                    "#60a5fa",
                    "#34d399",
                    "#f87171",
                    "#fbbf24",
                    "#a78bfa",
                    "#38bdf8",
                    "#f472b6",
                    "#c084fc",
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 20 },
              plugins: {
                legend: {
                  position: "right",
                  labels: { font: { size: 12 } },
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) =>
                      formatearPrecio(context.raw || 0),
                  },
                },
                datalabels: {
                  color: "#333",
                  font: { weight: "bold", size: 12 },
                  formatter: (value: number) => formatearPrecio(value),
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
