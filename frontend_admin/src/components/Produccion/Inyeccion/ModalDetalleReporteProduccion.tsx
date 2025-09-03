import { For, Show, createMemo } from "solid-js";
import type {
  ReporteProduccionInyeccionEncabezado,
  ReporteProduccionInyeccionDetalle,
} from "@/types/produccionInyeccion";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";

type Props = {
  reporte: ReporteProduccionInyeccionEncabezado;
  onCerrar: () => void;
};

/** Extrae costo unitario si existe en la Pieza (costoDux o costo) */
function getCostoUnitario(det: ReporteProduccionInyeccionDetalle): number | null {
  const pieza: any = det.Pieza || {};
  const val = pieza.costoDux ?? pieza.costo ?? null;
  const n = typeof val === "string" ? Number(val) : val;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

/** Determina si la fila debe excluirse del total de piezas */
function esFilaExcluida(det: ReporteProduccionInyeccionDetalle): boolean {
  const pieza: any = det.Pieza || {};
  const texto = `${pieza.descripcion ?? ""} ${pieza.nombre ?? ""}`.toLowerCase();
  return ["purga", "problema", "encendido", "no funciona", "cambio", "ajuste", "limpieza", "prueba"]
    .some((k) => texto.includes(k));
}

/** Utilidades de tiempo */
function hhmmToMinutes(hhmm?: string | null): number | null {
  if (!hhmm || typeof hhmm !== "string") return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

/** Intervalo [s,e) en minutos; si cruza medianoche ajusta sumando 24h al fin */
function intervalFrom(
  horaDesde?: string | null,
  horaHasta?: string | null
): { s: number; e: number } | null {
  const d = hhmmToMinutes(horaDesde);
  const h = hhmmToMinutes(horaHasta);
  if (d == null || h == null) return null;
  const s = d;
  const e = h >= d ? h : h + 24 * 60;
  if (e <= s) return null;
  return { s, e };
}

function mergeIntervals(intervals: { s: number; e: number }[]): { s: number; e: number }[] {
  if (!intervals.length) return [];
  const arr = [...intervals].sort((a, b) => a.s - b.s);
  const res: { s: number; e: number }[] = [];
  let cur = { ...arr[0] };
  for (let i = 1; i < arr.length; i++) {
    const it = arr[i];
    if (it.s <= cur.e) cur.e = Math.max(cur.e, it.e);
    else { res.push(cur); cur = { ...it }; }
  }
  res.push(cur);
  return res;
}
function sumIntervals(intervals: { s: number; e: number }[]): number {
  return intervals.reduce((acc, it) => acc + (it.e - it.s), 0);
}
/** Suma de intersección entre dos listas de intervalos YA MERGEADAS */
function sumIntersection(A: { s: number; e: number }[], B: { s: number; e: number }[]): number {
  let i = 0, j = 0, total = 0;
  while (i < A.length && j < B.length) {
    const a = A[i], b = B[j];
    const s = Math.max(a.s, b.s);
    const e = Math.min(a.e, b.e);
    if (e > s) total += e - s;
    if (a.e < b.e) i++; else j++;
  }
  return total;
}
function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Máquina */
function machineKey(det: ReporteProduccionInyeccionDetalle): string {
  const id = (det as any).MaquinaId ?? det.Maquina?.id;
  const nombre = det.Maquina?.nombre ?? "sin-maquina";
  return id != null ? String(id) : nombre;
}
function machineName(det: ReporteProduccionInyeccionDetalle): string {
  return det.Maquina?.nombre ?? "Sin máquina";
}

/** Helpers orden por máquina y hora */
function machineLabel(det: ReporteProduccionInyeccionDetalle): string {
  return det.Maquina?.nombre?.toString() || "Sin máquina";
}
function timeOrNullToMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export default function ModalDetalleReporteProduccion(props: Props) {
  const { reporte } = props;
  const detalles = () => reporte.Detalles || [];

  const hayCostos = createMemo(() =>
    detalles().some((d) => {
      const c = getCostoUnitario(d);
      return c !== null && c > 0;
    })
  );

  // Totales de piezas (excluyendo categorías especiales)
  const totalCantidad = createMemo(
    () => detalles().filter((d) => !esFilaExcluida(d))
      .reduce((acc, d) => acc + (Number(d.cantidad) || 0), 0)
  );
  // Total de fallados (global)
  const totalFallados = createMemo(
    () => detalles().reduce((acc, d) => acc + (Number(d.fallados) || 0), 0)
  );
  // Monto total
  const totalMonto = createMemo(() =>
    detalles().reduce((acc, d) => {
      const cu = getCostoUnitario(d);
      const cant = Number(d.cantidad) || 0;
      return acc + (cu ? cu * cant : 0);
    }, 0)
  );

  /** Desglose por máquina con unión de intervalos y solapado */
  const perMachine = createMemo(() => {
    const incl: Record<string, { name: string; ivs: { s: number; e: number }[] }> = {};
    const excl: Record<string, { name: string; ivs: { s: number; e: number }[] }> = {};

    for (const d of detalles()) {
      const key = machineKey(d);
      const name = machineName(d);
      const intv = intervalFrom(d.horaDesde as any, d.horaHasta as any);
      if (!intv) continue;
      if (esFilaExcluida(d)) (excl[key] ||= { name, ivs: [] }).ivs.push(intv);
      else (incl[key] ||= { name, ivs: [] }).ivs.push(intv);
    }

    const keys = Array.from(new Set([...Object.keys(incl), ...Object.keys(excl)]));
    return keys.map((k) => {
      const name = (incl[k]?.name ?? excl[k]?.name ?? k) || k;
      const inclMerged = mergeIntervals(incl[k]?.ivs ?? []);
      const exclMerged = mergeIntervals(excl[k]?.ivs ?? []);
      const inclSum = sumIntervals(inclMerged);
      const exclSum = sumIntervals(exclMerged);
      const solapado = sumIntersection(inclMerged, exclMerged);
      const neto = Math.max(0, inclSum - solapado);
      return { key: k, name, incluido: inclSum, excluido: exclSum, solapado, neto };
    }).sort((a, b) => a.name.localeCompare(b.name, "es"));
  });

  // Agregados globales por máquina
  const tiempoIncluidoMin = createMemo(() => perMachine().reduce((acc, m) => acc + m.incluido, 0));
  const tiempoExcluidoMin = createMemo(() => perMachine().reduce((acc, m) => acc + m.excluido, 0));
  const tiempoNetoMin = createMemo(() => perMachine().reduce((acc, m) => acc + m.neto, 0));

  /** Orden de filas: Máquina, Hora desde */
  const sortedDetalles = createMemo(() => {
    const arr = [...(detalles() ?? [])];
    arr.sort((a, b) => {
      const cmpMaq = machineLabel(a).localeCompare(machineLabel(b), "es", { sensitivity: "base", numeric: true });
      if (cmpMaq !== 0) return cmpMaq;
      const aMin = timeOrNullToMinutes(a.horaDesde as any);
      const bMin = timeOrNullToMinutes(b.horaDesde as any);
      if (aMin == null && bMin == null) return 0;
      if (aMin == null) return 1;
      if (bMin == null) return -1;
      if (aMin !== bMin) return aMin - bMin;
      const aEnd = timeOrNullToMinutes(a.horaHasta as any);
      const bEnd = timeOrNullToMinutes(b.horaHasta as any);
      if (aEnd == null && bEnd == null) return 0;
      if (aEnd == null) return 1;
      if (bEnd == null) return -1;
      if (aEnd !== bEnd) return aEnd - bEnd;
      const aCod = a.Pieza?.codigo?.toString() ?? "";
      const bCod = b.Pieza?.codigo?.toString() ?? "";
      return aCod.localeCompare(bCod, "es", { sensitivity: "base", numeric: true });
    });
    return arr;
  });

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={props.onCerrar}>
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-auto md:h-[95vh] p-6 border border-gray-300 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cerrar */}
        <button
          onClick={props.onCerrar}
          class="absolute top-4 right-6 text-gray-500 hover:text-red-600 text-2xl font-bold"
          title="Cerrar"
        >
          ×
        </button>

        {/* Header */}
        <h2 class="text-2xl font-bold mb-4 border-b pb-2">
          Detalle del Reporte de Producción (Inyección)
        </h2>

        {/* Datos cabecera */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 mb-4 text-base">
          <div><b>Fecha:</b> {formatearFechaCorta(reporte.fecha)}</div>
          <div><b>Turno:</b> <span class="capitalize">{reporte.turno}</span></div>
          <div><b>Usuario:</b> {reporte.Usuario?.nombre ?? "-"}</div>
          <div class="md:col-span-2"><b>Notas:</b> {reporte.nota ?? "-"}</div>
        </div>

        {/* Tabla (solo filas) */}
        <div class="overflow-x-auto flex-1 max-h-[55vh] mb-0 rounded-lg border">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-gray-100 sticky top-0 z-10">
              <tr class="text-left">
                <th class="p-3">Código</th>
                <th class="p-3">Pieza</th>
                <th class="p-3">Operario</th>
                <th class="p-3">Máquina</th>
                <th class="p-3">Desde</th>
                <th class="p-3">Hasta</th>
                <th class="p-3 text-right">Cantidad</th>
                <th class="p-3 text-right">Fallados</th>
                <Show when={hayCostos()}>
                  <>
                    <th class="p-3 text-right">Precio Unit.</th>
                    <th class="p-3 text-right">Subtotal</th>
                  </>
                </Show>
              </tr>
            </thead>
            <tbody>
              <For each={sortedDetalles()}>
                {(item) => {
                  const cu = getCostoUnitario(item);
                  const subtotal = cu ? cu * (Number(item.cantidad) || 0) : null;
                  return (
                    <tr class="border-t hover:bg-gray-50">
                      <td class="p-3">{item.Pieza?.codigo ?? "-"}</td>
                      <td class="p-3">
                        {item.Pieza?.descripcion ?? "-"}
                        <Show when={(item.Pieza as any)?.sku}>
                          <span class="text-xs text-gray-500 ml-1">
                            ({(item.Pieza as any).sku})
                          </span>
                        </Show>
                      </td>
                      <td class="p-3">{item.Operario?.nombre ?? "-"}</td>
                      <td class="p-3">{item.Maquina?.nombre ?? "-"}</td>
                      <td class="p-3">{item.horaDesde?.slice(0, 5) ?? "-"}</td>
                      <td class="p-3">{item.horaHasta?.slice(0, 5) ?? "-"}</td>
                      <td class="p-3 text-right font-mono">{item.cantidad}</td>
                      <td class="p-3 text-right font-mono">{item.fallados}</td>
                      <Show when={hayCostos()}>
                        <>
                          <td class="p-3 text-right">
                            {cu ? formatearPrecio(cu) : "-"}
                          </td>
                          <td class="p-3 text-right font-semibold">
                            {subtotal !== null ? formatearPrecio(subtotal) : "-"}
                          </td>
                        </>
                      </Show>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>

        {/* Totales fijos fuera de la tabla */}
        <div class="mt-4 space-y-3">
          {/* Barra principal de totales */}
          <div class="rounded-lg border bg-white shadow-sm p-2">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div class="flex items-center justify-between md:block">
                <div class="text-xs uppercase text-gray-500">Piezas (excluye purga/problema/...)</div>
                <div class="text-sm font-bold">{totalCantidad()}</div>
              </div>
              <div class="flex items-center justify-between md:block">
                <div class="text-xs uppercase text-gray-500">Fallados (total)</div>
                <div class="text-sm font-bold">{totalFallados()}</div>
              </div>
              <div class="flex items-center justify-between md:block">
                <div class="text-xs uppercase text-gray-500">Tiempo</div>
                <div class="text-sm">
                  <span class="font-semibold">Excluido:</span> {formatMin(tiempoExcluidoMin())} ·{" "}
                  <span class="font-semibold">Neto:</span> {formatMin(tiempoNetoMin())}
                </div>
              </div>
              <Show when={hayCostos()}>
                <div class="flex items-center justify-between md:block">
                  <div class="text-xs uppercase text-gray-500">Monto total</div>
                  <div class="text-sm font-bold">{formatearPrecio(totalMonto())}</div>
                </div>
              </Show>
            </div>
          </div>

          {/* Desglose por máquina */}
          <div class="rounded-lg border bg-white shadow-sm p-2">
            <div class="flex flex-wrap gap-3">
              <For each={perMachine()}>
                {(m) => (
                  <div class="text-xs px-2 py-1 rounded-full border bg-white shadow-sm">
                    <span>{m.name}:</span>{" "}
                    <span class="font-bold">{formatMin(m.neto + m.excluido)}</span>
                    <span class="text-gray-600">
                      {" "}(
                      Incl: {formatMin(m.incluido)} ·
                      Excl: {formatMin(m.excluido)} ·
                      )
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* Footer acciones 
        <div class="flex justify-end mt-4">
          <button
            onClick={props.onCerrar}
            class="px-6 py-2 border rounded text-base hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>*/}
      </div>
    </div>
  );
}
