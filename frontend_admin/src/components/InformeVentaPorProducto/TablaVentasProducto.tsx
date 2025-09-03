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
    <th class="px-3 py-2 text-left cursor-pointer select-none" onClick={() => props.onOrdenar(k)}>
      {label}{props.orden === k ? (props.direccion === "ASC" ? " ▲" : " ▼") : ""}
    </th>
  );
  const CellMonto = (v: number) => <span>{formatearPrecio(v || 0)}</span>;
  const CellCant  = (v: number) => <span>{formatearMiles(Math.round(v || 0))}</span>;

  const promMensual = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_12m || 0) / 12 : (r.monto_12m || 0) / 12;

  const promTrimestre = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_3m || 0) / 3 : (r.monto_3m || 0) / 3;

  const ordenarPromedio = () => props.onOrdenar(props.modo === "cantidad" ? "cant_12m" : "monto_12m");

  // === valores según modo ===
  const valAnt = (r: Row) => (props.modo === "cantidad" ? r.cant_mes_anterior : r.monto_mes_anterior) || 0;
  const valAct = (r: Row) => (props.modo === "cantidad" ? r.cant_mes_actual   : r.monto_mes_actual)   || 0;

  // === tasas diarias ===
  const daysElapsed = () => new Date().getDate();           // días transcurridos del mes actual
  const rateAnt = (r: Row) => (valAnt(r) || 0) / 30;        // mes anterior / 30
  const rateAct = (r: Row) => (daysElapsed() ? (valAct(r) || 0) / daysElapsed() : 0);

  // === chip de tendencia ===
  const Trend = (p: { current: number; baseline: number; title?: string }) => {
    const pct = () => {
      if (!p.baseline && !p.current) return 0;
      if (!p.baseline && p.current)  return null; // +∞
      return (p.current - p.baseline) / p.baseline;
    };
    const dir   = () => (pct() === 0 ? 0 : pct() === null ? 1 : pct()! > 0 ? 1 : -1);
    const color = () => dir() > 0 ? "text-emerald-700 bg-emerald-100"
                    : dir() < 0 ? "text-rose-700 bg-rose-100"
                                : "text-gray-600 bg-gray-100";
    const arrow = () => dir() > 0 ? "▲" : dir() < 0 ? "▼" : "—";
    const pctStr= () => pct() === null ? "+∞%" : `${(Math.abs(pct() || 0) * 100).toFixed(1)}%`;

    return (
      <Show when={pct() !== undefined}>
        <span class={`ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${color()}`} title={p.title}>
          <span class="leading-none">{arrow()}</span>
          <span class="leading-none">{pctStr()}</span>
        </span>
      </Show>
    );
  };

  return (
    <div class="overflow-x-auto border rounded">
      <table class="min-w-[920px] w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            {Th("codigo","Código")}
            {Th("descripcion","Descripción")}

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
              title="Promedio mensual calculado sobre 3 meses (vs Anual)"
            >
              Prom. Trimes
            </th>

            <Show when={props.modo === "cantidad"} fallback={
              <>
                {Th("monto_mes_anterior","$ Mes ant")}
                {Th("monto_mes_actual","$ Mes actual")}
              </>
            }>
              <>
                {Th("cant_mes_anterior","Cant. Mes ant")}
                {Th("cant_mes_actual","Cant. Mes actual")}
              </>
            </Show>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => {
            const anual = promMensual(r);
            const trimes= promTrimestre(r);
            const ant   = valAnt(r);
            const act   = valAct(r);
            const rAnt  = rateAnt(r);
            const rAct  = rateAct(r);

            return (
              <tr class="border-t hover:bg-gray-50">
                <td class="px-3 py-2">{r.codigo}</td>
                <td class="px-3 py-2">{r.descripcion}</td>

                {/* Prom. Anual (valor solo) */}
                <td class="px-3 py-2">
                  <Show when={props.modo === "cantidad"} keyed fallback={CellMonto(anual)}>
                    {CellCant(anual)}
                  </Show>
                </td>

                {/* Prom. Trimes (vs Anual) */}
                <td class="px-3 py-2">
                  <Show when={props.modo === "cantidad"} keyed fallback={CellMonto(trimes)}>
                    {CellCant(trimes)}
                  </Show>
                  <Trend current={trimes} baseline={anual} title="Vs Prom. Anual" />
                </td>

                {/* Mes anterior (vs Trimestral) */}
                <td class="px-3 py-2">
                  <Show when={props.modo === "cantidad"} keyed fallback={CellMonto(ant)}>
                    {CellCant(ant)}
                  </Show>
                  <Trend current={ant} baseline={trimes} title="Vs Prom. Trimestral" />
                </td>

                {/* Mes actual (tasa diaria actual vs mes anterior/30) */}
                <td class="px-3 py-2">
                  <Show when={props.modo === "cantidad"} keyed fallback={CellMonto(act)}>
                    {CellCant(act)}
                  </Show>
                  <Trend current={rAct} baseline={rAnt} title={`Tasa diaria: actual (${daysElapsed()}d) vs mes anterior/30`} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
