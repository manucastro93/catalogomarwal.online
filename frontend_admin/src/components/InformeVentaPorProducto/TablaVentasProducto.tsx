// src/components/Estadisticas/TablaVentasProducto.tsx
import { For, Show } from "solid-js";
import { formatearPrecio, formatearMiles } from "@/utils/formato";

type Row = {
  productoId: number;
  codigo: string;
  descripcion: string;
  cant_mes_actual: number;
  monto_mes_actual: number;
  cant_mes_anterior: number;
  monto_mes_anterior: number;
  cant_3m: number;
  monto_3m: number;
  cant_12m: number;
  monto_12m: number;
};

export default function TablaVentasProducto(props: {
  rows: Row[];
  orden: string;
  direccion: "ASC" | "DESC";
  onOrdenar: (col: string) => void;
  modo: "cantidad" | "monto";
}) {
  const Th = (k: string, label: string) => (
    <th
      class="px-3 py-2 text-left cursor-pointer select-none"
      onClick={() => props.onOrdenar(k)}
    >
      {label}
      {props.orden === k ? (props.direccion === "ASC" ? " ▲" : " ▼") : ""}
    </th>
  );

  const formatNum = (v: number) => formatearMiles(Math.round(v || 0));
  const formatMoney = (v: number) => <span>{formatearPrecio(v || 0)}</span>;

  const promAnual = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_12m || 0) / 12 : (r.monto_12m || 0) / 12;

  const promTrimestre = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_3m || 0) / 3 : (r.monto_3m || 0) / 3;

  const mesAnterior = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_mes_anterior || 0) : (r.monto_mes_anterior || 0);

  const mesActual = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_mes_actual || 0) : (r.monto_mes_actual || 0);

  // === Normalización diaria para "tendencia de cómo venimos" ===
  const daysElapsed = () => new Date().getDate(); // días transcurridos del mes actual (1..31)
  const rateMesAnt = (r: Row) => (mesAnterior(r) || 0) / 30; // promedio diario mes anterior
  const rateMesAct = (r: Row) => {
    const d = daysElapsed();
    return d > 0 ? (mesActual(r) || 0) / d : 0; // promedio diario del mes actual
  };

  // === Componente de indicador (flecha + % dif) ===
  const Trend = (props_: { current: number; baseline: number; title?: string }) => {
    const { current, baseline, title } = props_;
    const same = Number.isFinite(baseline) && baseline === 0;

    // % cambio: (current - baseline) / baseline
    let pct: number | null;
    if (!baseline && !current) pct = 0;
    else if (!baseline && current) pct = null; // crecimiento desde 0 -> mostrar +∞
    else pct = (current - baseline) / baseline;

    const dir =
      pct === 0
        ? 0
        : pct === null
        ? 1
        : pct > 0
        ? 1
        : pct < 0
        ? -1
        : 0;

    const color =
      dir > 0 ? "text-emerald-600 bg-emerald-100" : dir < 0 ? "text-rose-600 bg-rose-100" : "text-gray-600 bg-gray-100";
    const arrow = dir > 0 ? "▲" : dir < 0 ? "▼" : "—";

    const pctStr =
      pct === null
        ? "+∞%"
        : `${(Math.abs(pct || 0) * 100).toFixed(1)}%`;

    // Si baseline=0 y current=0 => 0%
    const label = same && current === 0 ? "0.0%" : pctStr;

    return (
      <span
        class={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${color}`}
        title={title}
      >
        <span class="leading-none">{arrow}</span>
        <span class="leading-none">{label}</span>
      </span>
    );
  };

  const ordenarPromedio = () =>
    props.onOrdenar(props.modo === "cantidad" ? "cant_12m" : "monto_12m");

  const renderValor = (v: number) => (props.modo === "cantidad" ? formatNum(v) : formatMoney(v));

  return (
    <div class="overflow-x-auto border rounded">
      <table class="min-w-[920px] w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            {Th("codigo", "Código")}
            {Th("descripcion", "Descripción")}

            <th
              class="px-3 py-2 text-left cursor-pointer select-none"
              onClick={ordenarPromedio}
              title="Promedio mensual calculado sobre 12 meses"
            >
              Prom. Anual
            </th>

            <th
              class="px-3 py-2 text-left cursor-pointer select-none"
              onClick={ordenarPromedio}
              title="Promedio mensual calculado sobre 3 meses (comparado contra Prom. Anual)"
            >
              Prom. Trimes
            </th>

            {props.modo === "cantidad" ? (
              <>
                {Th("cant_mes_anterior", "Cant. Mes ant")}
                <th
                  class="px-3 py-2 text-left cursor-pointer select-none"
                  onClick={() =>
                    props.onOrdenar("cant_mes_actual")
                  }
                  title="Cant. Mes actual (flecha compara tasa diaria actual vs mes anterior/30)"
                >
                  Cant. Mes actual
                </th>
              </>
            ) : (
              <>
                {Th("monto_mes_anterior", "$ Mes ant")}
                <th
                  class="px-3 py-2 text-left cursor-pointer select-none"
                  onClick={() =>
                    props.onOrdenar("monto_mes_actual")
                  }
                  title="$ Mes actual (flecha compara tasa diaria actual vs mes anterior/30)"
                >
                  $ Mes actual
                </th>
              </>
            )}
          </tr>
        </thead>

        <tbody>
          <For each={props.rows}>
            {(r) => {
              const anual = promAnual(r);
              const trimes = promTrimestre(r);
              const ant = mesAnterior(r);
              const act = mesActual(r);

              const rAnt = rateMesAnt(r);
              const rAct = rateMesAct(r);

              return (
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-3 py-2">{r.codigo}</td>
                  <td class="px-3 py-2">{r.descripcion}</td>

                  {/* Prom. Anual (sin comparación previa) */}
                  <td class="px-3 py-2">
                    {renderValor(anual)}
                  </td>

                  {/* Prom. Trimes (vs Prom. Anual) */}
                  <td class="px-3 py-2">
                    {renderValor(trimes)}
                    <Trend
                      current={trimes}
                      baseline={anual}
                      title="Comparado vs Prom. Anual"
                    />
                  </td>

                  {/* Mes anterior (vs Prom. Trimes) */}
                  <td class="px-3 py-2">
                    {renderValor(ant)}
                    <Trend
                      current={ant}
                      baseline={trimes}
                      title="Comparado vs Prom. Trimestral"
                    />
                  </td>

                  {/* Mes actual (flecha compara tasas diarias: actual vs (mes anterior / 30)) */}
                  <td class="px-3 py-2">
                    {renderValor(act)}
                    <Trend
                      current={rAct}
                      baseline={rAnt}
                      title={`Comparado tasa diaria: actual (${daysElapsed()}d) vs mes anterior/30`}
                    />
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}
