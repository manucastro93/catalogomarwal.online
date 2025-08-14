import { createMemo, Show } from "solid-js";
import { Bar } from "solid-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  LineElement,
  PointElement,
} from "chart.js";
import type { ClienteDuxPorMesMonetizado } from "@/types/clienteDux";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  LineElement,
  PointElement
);

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

type PedidosMesLike = Array<{
  mes?: string;
  month?: string;
  fecha?: string;
  cantidad?: number;
  count?: number;
  total?: number;
}>;

function normMonthKey(s?: string | null): string | null {
  if (!s) return null;
  return s.length >= 7 ? s.slice(0, 7) : null; // "YYYY-MM"
}

export default function GraficoBarras(props: {
  data: (ClienteDuxPorMesMonetizado & {
    pedidosTotal?: number;
    pedidosVendedor?: number; // <- viene del backend si hay vendedor seleccionado
  })[];
  mostrarMontos?: boolean;
  /** opcional: si querés pasar pedidos por mes desde otro servicio */
  pedidosPorMes?: PedidosMesLike;
}) {
  // --- filtro por mediana de clientes (para outliers) ---
  const datosFiltrados = createMemo(() => {
    const vals = props.data.map((d) => d.total ?? 0);
    const ord = [...vals].sort((a, b) => a - b);
    const mediana = ord.length ? ord[Math.floor(ord.length / 2)] : 0;
    return props.data.filter((d) => (d.total ?? 0) <= mediana * 2);
  });

  // --- mapa normalizado de pedidos (fallback si no viene pedidosTotal en data) ---
  const mapaPedidos = createMemo(() => {
    const arr = (props.pedidosPorMes ?? []) as PedidosMesLike;
    const map = new Map<string, number>();
    for (const p of arr) {
      const mes = normMonthKey(p.mes ?? p.month ?? p.fecha ?? null);
      if (!mes) continue;
      const cant = Number(p.cantidad ?? p.count ?? p.total ?? 0);
      map.set(mes, cant);
    }
    return map;
  });

  const chartData = createMemo(() => {
    const rows = datosFiltrados();
    const labels = rows.map((d) => d.mes);

    const tieneVendedorCant = rows.some((d) => typeof d.vendedor === "number");
    const mostrarMontos = !!props.mostrarMontos;
    const tieneMontoVendedor =
      mostrarMontos && rows.some((d) => d.montoVendedor != null);

    const hayPedidosEnData = rows.some((d: any) => typeof d.pedidosTotal === "number");
    const hayPedidosEnProp = mapaPedidos().size > 0;
    const usarPedidos = hayPedidosEnData || hayPedidosEnProp;

    // nuevo: si el backend trae pedidosVendedor, mostramos esa serie
    const tienePedidosVendedor = rows.some((d: any) => d.pedidosVendedor != null);

    const datasets: any[] = [
      {
        label: "Clientes Nuevos",
        type: "bar",
        data: rows.map((d) => d.total ?? 0),
        backgroundColor: "#2563eb",
        borderWidth: 0,
        yAxisID: "y",
        order: 3,
      },
    ];

    if (tieneVendedorCant) {
      datasets.push({
        label: "Clientes Nuevos (Vendedor)",
        type: "bar",
        data: rows.map((d) => d.vendedor ?? 0),
        backgroundColor: "#f97316",
        borderWidth: 0,
        yAxisID: "y",
        order: 3,
      });
    }

    // Línea: pedidos totales (usa data.pedidosTotal y, si falta, el mapa normalizado)
    if (usarPedidos) {
      datasets.push({
        label: "Pedidos (Total)",
        type: "line",
        data: rows.map((d: any) => d.pedidosTotal ?? mapaPedidos().get(d.mes) ?? 0),
        borderColor: "#8b5cf6", // violeta
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.25,
        yAxisID: "y",
        order: 2,
      });
    }

    // ✅ NUEVO: Línea de pedidos del vendedor (si viene en data)
    if (tienePedidosVendedor) {
      datasets.push({
        label: "Pedidos (Vendedor)",
        type: "line",
        data: rows.map((d: any) => d.pedidosVendedor ?? 0),
        borderColor: "#ec4899", // rosa
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.25,
        yAxisID: "y",
        order: 2,
      });
    }

    if (mostrarMontos) {
      datasets.push({
        label: "Monto (Total)",
        type: "line",
        data: rows.map((d) => d.montoTotal ?? 0),
        borderColor: "#0ea5e9",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.3,
        yAxisID: "y1",
        order: 1,
      });

      if (tieneMontoVendedor) {
        datasets.push({
          label: "Monto (Vendedor)",
          type: "line",
          data: rows.map((d) => d.montoVendedor ?? 0),
          borderColor: "#10b981",
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: false,
          tension: 0.3,
          yAxisID: "y1",
          order: 1,
        });
      }
    }

    return { labels, datasets };
  });

  const chartOptions = createMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function (ctx: any) {
            const raw = ctx.parsed?.y ?? ctx.raw ?? 0;
            const isMonto =
              ctx.dataset?.yAxisID === "y1" ||
              String(ctx.dataset?.label || "").toLowerCase().includes("monto");
            const val = isMonto ? fmtARS.format(raw) : raw;
            return ` ${ctx.dataset.label}: ${val}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Clientes / Pedidos" },
        grid: { drawOnChartArea: true },
      },
      y1: props.mostrarMontos
        ? {
            position: "right",
            beginAtZero: true,
            title: { display: true, text: "Monto" },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (v: number | string) => {
                const n = typeof v === "string" ? Number(v) : (v as number);
                return fmtARS.format(n);
              },
            },
          }
        : undefined,
      x: {
        ticks: { maxRotation: 0, autoSkip: true },
      },
    },
  }));

  return (
    <Show when={datosFiltrados().length}>
      <div class="w-full h-[340px]">
        <Bar data={chartData()} options={chartOptions()} />
      </div>
    </Show>
  );
}
