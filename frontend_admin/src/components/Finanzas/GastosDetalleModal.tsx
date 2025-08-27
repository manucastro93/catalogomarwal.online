import { createResource, createSignal, Show } from "solid-js";
import { obtenerGastosPorCategoria, obtenerGastosProveedores } from "@/services/finanzas.service";
import TablaMensual, { RowData } from "./TablaMensual";
import GastosComprobantesModal from "./GastosComprobantesModal";
import type { YearKey, YearRow, GastoCategoria, GastoProveedor } from "@/types/finanzas";

const emptyYear = (): YearRow => ({ ene:0,feb:0,mar:0,abr:0,may:0,jun:0,jul:0,ago:0,sep:0,oct:0,nov:0,dic:0 });
const MONTHS: readonly YearKey[] = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;

export default function GastosDetalleModal(props: { anio:number; onClose:()=>void }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = createSignal<{ id:number; nombre:string }|null>(null);

  const [cats] = createResource(() => props.anio, obtenerGastosPorCategoria);
  const [provs] = createResource(
    () => (categoriaSeleccionada() ? { anio: props.anio, categoriaId: categoriaSeleccionada()!.id } : null),
    (p) => obtenerGastosProveedores(p!.anio, p!.categoriaId)
  );

  const [cell, setCell] = createSignal<{ month: YearKey; categoriaId?: number; proveedorId?: number; titulo: string }|null>(null);

  const rowsCategorias = () =>
    (cats() ?? []).map((c: GastoCategoria): RowData => ({
      id: c.categoriaId,
      label: c.categoriaNombre,
      valores: c.valores,
      variacion: c.variacion,
      onClick: () => setCategoriaSeleccionada({ id: Number(c.categoriaId), nombre: c.categoriaNombre })
    }));

  const rowsProveedores = () =>
    (provs() ?? []).map((p: GastoProveedor): RowData => ({
      id: p.proveedorId,
      label: p.proveedorNombre,
      valores: p.valores,
      variacion: p.variacion,
    }));

  const totalRow = (rows: RowData[]): RowData => {
    const acc = emptyYear();
    for (const r of rows) for (const k of MONTHS) acc[k] += r.valores[k] ?? 0;
    const variacion = emptyYear();
    for (let i = 1; i < MONTHS.length; i++) {
      const a = acc[MONTHS[i-1]] || 0, b = acc[MONTHS[i]] || 0;
      variacion[MONTHS[i]] = a === 0 ? 0 : ((b - a) / a) * 100;
    }
    return { id: "__total__", label: "TOTAL", valores: acc, variacion, emphasize: true };
  };

  const handleValueClick = (row: RowData, month: YearKey) => {
    if (categoriaSeleccionada()) {
      // contexto PROVEEDORES
      setCell({
        month,
        proveedorId: Number(row.id),
        titulo: `Detalle de comprobantes · ${row.label} · ${month.toUpperCase()} ${props.anio}`,
      });
    } else {
      // contexto CATEGORÍAS
      setCell({
        month,
        categoriaId: Number(row.id),
        titulo: `Detalle de comprobantes · ${row.label} · ${month.toUpperCase()} ${props.anio}`,
      });
    }
  };

  const content = () => {
    if (categoriaSeleccionada()) {
      const rows = rowsProveedores();
      return <TablaMensual rows={[...rows, totalRow(rows)]} onValueClick={handleValueClick} />;
    }
    const rows = rowsCategorias();
    return <TablaMensual rows={[...rows, totalRow(rows)]} onValueClick={handleValueClick} />;
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-semibold">
            {categoriaSeleccionada()
              ? `Proveedores de ${categoriaSeleccionada()!.nombre} · ${props.anio}`
              : `Gastos por categoría · ${props.anio}`}
          </h3>
          <div class="flex gap-2">
            {categoriaSeleccionada() && (
              <button class="px-3 py-1 rounded bg-gray-200" onClick={() => setCategoriaSeleccionada(null)}>
                ← Volver
              </button>
            )}
            <button class="px-3 py-1 rounded bg-gray-200" onClick={props.onClose}>Cerrar</button>
          </div>
        </div>
        <div class="p-4 overflow-y-auto">{content()}</div>
      </div>

      <Show when={cell()}>
        <GastosComprobantesModal
          anio={props.anio}
          monthKey={cell()!.month}
          categoriaId={cell()!.categoriaId}
          proveedorId={cell()!.proveedorId}
          titulo={cell()!.titulo}
          onClose={() => setCell(null)}
        />
      </Show>
    </div>
  );
}
