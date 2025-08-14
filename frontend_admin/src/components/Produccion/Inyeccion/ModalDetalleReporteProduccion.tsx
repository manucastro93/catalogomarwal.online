import { For, Show, createMemo } from "solid-js";
import type { ReporteProduccionInyeccionEncabezado, ReporteProduccionInyeccionDetalle } from "@/types/produccionInyeccion";
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

export default function ModalDetalleReporteProduccion(props: Props) {
  const { reporte } = props;

  // ¿Hay alguna fila con costo unitario? => mostramos columnas de monto
  const hayCostos = createMemo(() =>
    (reporte.Detalles || []).some(d => {
      const c = getCostoUnitario(d);
      return c !== null && c > 0;
    })
  );

  const totalCantidad = createMemo(
    () => (reporte.Detalles || []).reduce((acc, d) => acc + (Number(d.cantidad) || 0), 0)
  );

  const totalMonto = createMemo(() =>
    (reporte.Detalles || []).reduce((acc, d) => {
      const cu = getCostoUnitario(d);
      const cant = Number(d.cantidad) || 0;
      return acc + (cu ? cu * cant : 0);
    }, 0)
  );

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={props.onCerrar}>
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-auto md:h-[90vh] p-6 border border-gray-300 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={props.onCerrar}
          class="absolute top-4 right-6 text-gray-500 hover:text-red-600 text-2xl font-bold"
          title="Cerrar"
        >
          ×
        </button>

        <h2 class="text-2xl font-bold mb-6 border-b pb-2">
          Detalle del Reporte de Producción (Inyección)
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 mb-5 text-base">
          <div><b>Fecha:</b> {formatearFechaCorta(reporte.fecha)}</div>
          <div><b>Turno:</b> <span class="capitalize">{reporte.turno}</span></div>
          <div><b>Usuario:</b> {reporte.Usuario?.nombre ?? "-"}</div>
          <div class="md:col-span-2"><b>Notas:</b> {reporte.nota ?? "-"}</div>
        </div>

        <div class="overflow-x-auto flex-1 max-h-[60vh] mb-3 rounded-lg border">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-gray-100 sticky top-0">
              <tr class="text-left">
                <th class="p-3">Pieza</th>
                <th class="p-3">Operario</th>
                <th class="p-3">Máquina</th>
                <th class="p-3">Desde</th>
                <th class="p-3">Hasta</th>
                <th class="p-3 text-right">Cantidad</th>
                <Show when={hayCostos()}>
                  <>
                    <th class="p-3 text-right">Precio Unit.</th>
                    <th class="p-3 text-right">Subtotal</th>
                  </>
                </Show>
              </tr>
            </thead>

            <tbody>
              <For each={reporte.Detalles}>
                {(item) => {
                  const cu = getCostoUnitario(item);
                  const subtotal = cu ? cu * (Number(item.cantidad) || 0) : null;
                  return (
                    <tr class="border-t hover:bg-gray-50">
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
                      <td class="p-3">{item.horaDesde?.slice(0,5) ?? "-"}</td>
                      <td class="p-3">{item.horaHasta?.slice(0,5) ?? "-"}</td>
                      <td class="p-3 text-right font-mono">{item.cantidad}</td>

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

              {/* Totales */}
              <tr class="bg-gray-50 border-t-2 border-gray-300">
                <td class="p-3 font-semibold text-right" colSpan={5}>
                  Total piezas
                </td>
                <td class="p-3 text-right font-bold">
                  {totalCantidad()}
                </td>
                <Show when={hayCostos()}>
                  <>
                    <td class="p-3 font-semibold text-right">Total $</td>
                    <td class="p-3 text-right font-bold text-base">
                      {formatearPrecio(totalMonto())}
                    </td>
                  </>
                </Show>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end mt-4">
          <button
            onClick={props.onCerrar}
            class="px-6 py-2 border rounded text-base hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
