import { Pie } from "solid-chartjs";
import type { ResumenProduccionCategoria } from "../../../../types/grafico";

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
          layout: { padding: 10 },
          plugins: {
            legend: {
              labels: {
                font: { size: 10 },
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
