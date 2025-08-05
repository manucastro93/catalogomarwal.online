// components/InformeClientesDux/GraficoPedidosPorMes.tsx
import { Show, createMemo } from "solid-js";
import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function GraficoPedidosPorMes(props: {
  data: { mes: string; totalPedidos: number; pedidosVendedor: number }[];
}) {
  const chartData = createMemo(() => {
    const labels = props.data.map((d) => d.mes);
    return {
      labels,
      datasets: [
        {
          label: "Pedidos totales",
          data: props.data.map((d) => d.totalPedidos),
          backgroundColor: "#2563eb", // azul
        },
        {
          label: "Pedidos del vendedor",
          data: props.data.map((d) => d.pedidosVendedor),
          backgroundColor: "#f97316", // naranja
        },
      ],
    };
  });

  return (
    <Show when={props.data.length}>
      <div class="w-full h-[280px] mt-10">
        <h2 class="text-lg font-semibold mb-2">Pedidos por mes</h2>
        <Bar
          data={chartData()}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
            },
            scales: {
              y: { beginAtZero: true },
            },
          }}
        />
      </div>
    </Show>
  );
}
