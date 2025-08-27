import { For, createMemo } from "solid-js";
import { formatearPrecio } from "@/utils/formato";
import type { YearKey, YearRow } from "@/types/finanzas";

const MONTHS: readonly YearKey[] = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;

function VariacionChip(props: { value: number }) {
  const v = () => Number.isFinite(props.value) ? props.value : 0;
  const cls = () =>
    v() > 0 ? "bg-emerald-100 text-emerald-700"
    : v() < 0 ? "bg-rose-100 text-rose-700"
    : "bg-gray-100 text-gray-600";
  const arrow = () => (v() > 0 ? "▲" : v() < 0 ? "▼" : "—");
  return (
    <span class={`inline-flex items-center justify-end min-w-[52px] px-2 py-0.5 rounded text-[11px] ${cls()}`}>
      {arrow()} {v().toFixed(1)}%
    </span>
  );
}

export type RowData = {
  id: string | number;
  label: string;
  valores: YearRow;
  variacion?: YearRow;
  onClick?: () => void;
  emphasize?: boolean;
};

export default function TablaMensual(props: {
  rows: RowData[];
  onValueClick?: (row: RowData, month: YearKey) => void;
}) {
  // Meses visibles: desde enero hasta el mes actual (0..11)
  const monthsToShow = createMemo<YearKey[]>(() => {
    const idx = new Date().getMonth(); // 0..11
    return MONTHS.slice(0, idx + 1) as YearKey[];
  });

  const totalRow = (r: RowData) =>
    monthsToShow().reduce((acc, m) => acc + (r.valores[m] ?? 0), 0);

  return (
    <div class="overflow-auto rounded-xl border shadow-sm">
      <table class="min-w-[920px] w-full text-sm">
        <thead>
          <tr class="bg-muted/50">
            <th class="sticky left-0 bg-muted/50 px-3 py-2 text-left w-56">Concepto</th>
            <For each={monthsToShow()}>
              {(m) => (
                <>
                  <th class="px-2 py-2 text-right text-[11px] font-medium">%</th>
                  <th class="px-3 py-2 text-right uppercase tracking-wide text-[11px] font-medium">{m}</th>
                </>
              )}
            </For>
            <th class="px-3 py-2 text-right uppercase tracking-wide text-[11px] font-semibold">Total</th>
          </tr>
        </thead>

        <tbody class="bg-white">
          <For each={props.rows}>
            {(r) => (
              <tr class="border-b hover:bg-muted/30 transition-colors">
                <th
                  class={`sticky left-0 bg-white/80 backdrop-blur px-3 py-2 text-left w-56 select-none ${
                    r.onClick ? "cursor-pointer hover:underline" : ""
                  } ${r.emphasize ? "font-semibold" : "font-normal"}`}
                  onClick={r.onClick}
                >
                  {r.label}
                </th>

                <For each={monthsToShow()}>
                  {(k) => (
                    <>
                    <td class="px-2 py-2 text-right">
                        {r.variacion
                          ? <VariacionChip value={r.variacion[k] ?? 0} />
                          : <span class="text-xs text-gray-400">—</span>}
                      </td>
                      <td
                        class={`px-3 py-2 text-right ${r.emphasize ? "font-semibold" : ""} ${
                          props.onValueClick ? "cursor-pointer hover:underline" : ""
                        }`}
                        onClick={() => props.onValueClick?.(r, k)}
                        title="Ver detalle"
                      >
                        {formatearPrecio(r.valores[k] ?? 0)}
                      </td>
                      
                    </>
                  )}
                </For>

                {/* TOTAL (solo suma de los meses visibles) */}
                <td class={`px-3 py-2 text-right ${r.emphasize ? "font-semibold" : ""}`}>
                  {formatearPrecio(totalRow(r))}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
