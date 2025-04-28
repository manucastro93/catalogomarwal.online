import { Line } from "solid-chartjs";
import type { EvolucionProduccion } from "../../../../types/grafico";

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
    <div class="w-full h-[400px] p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-xl font-semibold mb-4 text-center">Evolución de Producción</h2>
      <Line
        key={key}
        data={{
          labels,
          datasets: [{
            label: modo === "cantidad" ? "Cantidad producida" : "Valor producido",
            data: valores,
            fill: false,
            tension: 0.3
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } },
            y: { beginAtZero: true }
          }
        }}
      />
    </div>
  );
}
