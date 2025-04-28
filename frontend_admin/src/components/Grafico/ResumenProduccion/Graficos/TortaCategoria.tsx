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

  return (
    <div class="w-full flex flex-col justify-between h-[400px] p-4 shadow rounded bg-white">
      <h2 class="text-xl font-semibold mb-4 text-center">Producción por Categoría</h2>
      <div class="flex-1">
        <Pie
          key={modo}
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
          }}
        />
      </div>
    </div>
  );
}
