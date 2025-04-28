import { onCleanup, createResource, onMount } from "solid-js";
import Chart from "chart.js/auto";
import { obtenerVentasPorCategoria } from "@/services/estadisticas.service";
import { formatearPrecio } from "@/utils/formato";

let canvasRef: HTMLCanvasElement;

export default function GraficoVentasPorCategoria() {
  const [ventas] = createResource(obtenerVentasPorCategoria);
  let chart: Chart;

  const renderChart = () => {
    if (!ventas() || ventas()?.length === 0) return;

    const categorias = ventas()!.map(
      (v: { categoria: string; totalVentas: number }) => v.categoria
    );
    const totales = ventas()!.map(
      (v: { categoria: string; totalVentas: number }) => v.totalVentas
    );

    const colores = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff8042",
      "#a4de6c",
      "#d84a88",
      "#4ad8c6",
      "#f06292",
      "#4fc3f7",
      "#ba68c8",
    ];

    if (chart) chart.destroy(); // eliminar gráfico anterior si existe

    chart = new Chart(canvasRef, {
      type: "pie",
      data: {
        labels: categorias,
        datasets: [
          {
            data: totales,
            backgroundColor: colores.slice(0, categorias.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw as number;
                return `${label}: ${formatearPrecio(value)}`;
              },
            },
          },
        },
      },
    });
  };

  onMount(() => {
    const interval = setInterval(() => {
      if (ventas()) {
        renderChart();
        clearInterval(interval);
      }
    }, 100);
  });

  onCleanup(() => {
    chart?.destroy();
  });

  return (
    <div class="bg-white shadow-md rounded-xl p-4 w-full max-w-2xl">
      <h2 class="text-lg font-bold mb-4 text-gray-800">Ventas por Categoría</h2>
      <canvas ref={(el) => (canvasRef = el)} />
    </div>
  );
}
