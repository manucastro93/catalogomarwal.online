import { Bar } from "solid-chartjs";
import type { ResumenProduccionPlanta } from "../../../../types/grafico";

interface Props {
  datos: ResumenProduccionPlanta[];
  modo: "cantidad" | "valor";
}

export default function BarrasPlanta({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map(r => r.planta);
  const valores = datos.map(r => modo === "cantidad" ? r.totalCantidad : r.totalValor);
  const key = modo + "_" + labels.join("|");

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
  <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
    Producción por Planta
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
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 10 },
          scales: {
            y: { beginAtZero: true }
          },
          plugins: {
            legend: {
              labels: {
                font: { size: 10 }
              }
            }
          }
        }}
      />
    </div>
  </div>
</div>

  );
}
