import { Bar } from "solid-chartjs";
import { formatearMiles } from "@/utils/formato";

interface Props {
  datos: { codigo: string; valor: number }[];
}

export function LeadTimePorPedido({ datos }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((d) => d.codigo);
  const valores = datos.map((d) => d.valor);
  const key = "leadtime_pedido_" + labels.join("|");

  return (
    <div class="w-full p-2 md:p-4 shadow rounded bg-white">
      <h2 class="text-center text-base md:text-xl font-semibold mb-4">Lead Time por Pedido</h2>
      <div class="relative w-full h-[280px] md:h-[380px]">
        <Bar
          key={key}
          data={{
            labels,
            datasets: [{
              label: "Días",
              data: valores,
              backgroundColor: "#60a5fa"
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true },
              x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: any) => `Días: ${context.raw}`
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export function FillRatePorPedido({ datos }: Props) {
  if (!datos.length) return null;

  const labels = datos.map((d) => d.codigo);
  const valores = datos.map((d) => d.valor);
  const key = "fillrate_pedido_" + labels.join("|");

  return (
    <div class="w-full p-2 md:p-4 shadow rounded bg-white">
      <h2 class="text-center text-base md:text-xl font-semibold mb-4">Fill Rate por Pedido</h2>
      <div class="relative w-full h-[280px] md:h-[380px]">
        <Bar
          key={key}
          data={{
            labels,
            datasets: [{
              label: "%",
              data: valores,
              backgroundColor: "#34d399"
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 100 },
              x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 0 } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: any) => `Fill Rate: ${context.raw}%`
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
}
