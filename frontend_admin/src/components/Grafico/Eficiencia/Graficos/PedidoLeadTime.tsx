import { Bar } from "solid-chartjs";
import type { EficienciaPedido } from "@/types/eficiencia";

interface Props {
  datos: EficienciaPedido[];
}

export default function PedidoLeadTime({ datos }: Props) {
  if (!datos.length) return null;

  const labels = datos.map(d => d.nroPedido);
  const valores = datos.map(d => d.leadTimeDias ?? 0);
  const key = 'leadtime_' + labels.join('|');

  return (
    <div class="w-full min-h-[320px] md:min-h-[400px] p-2 md:p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-base md:text-xl font-semibold mb-2 md:mb-4 text-center">
        Lead Time por Pedido
      </h2>
      <div class="flex-1">
        <div class="relative w-full h-[280px] md:h-[380px]">
          <Bar
            key={key}
            data={{
              labels,
              datasets: [{
                label: 'Lead Time (días)',
                data: valores,
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              layout: { padding: 15 },
              scales: {
                y: { beginAtZero: true },
                x: { ticks: { autoSkip: true } }
              },
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (ctx: any) => `${ctx.label}: ${ctx.raw} días`
                  }
                },
                datalabels: {
                  color: '#333',
                  font: { weight: 'bold', size: 12 },
                  formatter: (val: number) => `${val} días`,
                  anchor: 'end',
                  align: 'start',
                  offset: 10,
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
