// src/components/Grafico/ResumenProduccion/BarrasTurno.tsx
import { Bar } from "solid-chartjs";
import type { ResumenProduccionTurno } from "../../../../types/grafico";

interface Props {
  datos: ResumenProduccionTurno[];
  modo: "cantidad" | "valor";
}

export default function BarrasTurno({ datos, modo }: Props) {
  if (!datos?.length) return null;

  const labels = datos.map(r => r.turno);
  const valores = datos.map(r => modo === "cantidad" ? r.totalCantidad : r.totalValor);

  return (
    <div class="w-full flex flex-col justify-between h-[400px] p-4 shadow rounded bg-white">
      <h2 class="text-xl font-semibold mb-4 text-center">Producción por Turno</h2>
      <div class="flex-1">
        <Bar
          key={modo}
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
            scales: { y: { beginAtZero: true } },
          }}
        />
      </div>
    </div>
  );
}
