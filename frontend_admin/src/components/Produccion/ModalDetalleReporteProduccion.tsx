import { For } from "solid-js";
import type { ReporteProduccionEncabezado } from "@/types/produccion";
import { formatearPrecio } from "@/utils/formato";

export default function ModalDetalleReporteProduccion(props: {
  reporte: ReporteProduccionEncabezado;
  onCerrar: () => void;
}) {
  const { reporte } = props;

  // Calcula total general del reporte
  const total = () =>
    reporte.productos?.reduce(
      (acc, item) =>
        acc +
        (item.cantidad && item.producto?.costoDux
          ? item.cantidad * item.producto.costoDux
          : 0),
      0
    ) ?? 0;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-auto md:h-[90vh] p-6 border border-gray-300 flex flex-col relative">
        <button
          onClick={props.onCerrar}
          class="absolute top-4 right-6 text-gray-500 hover:text-red-600 text-2xl font-bold"
          title="Cerrar"
        >
          ×
        </button>
        <h2 class="text-2xl font-bold mb-6 border-b pb-2">Detalle del Reporte de Producción</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 mb-5 text-base">
          <div><b>Fecha:</b> {new Date(reporte.fecha).toLocaleDateString()}</div>
          <div><b>Planta:</b> {reporte.planta?.nombre ?? reporte.plantaId}</div>
          <div><b>Turno:</b> <span class="capitalize">{reporte.turno}</span></div>
          <div><b>Usuario:</b> {reporte.usuario?.nombre}</div>
          <div class="md:col-span-2"><b>Notas:</b> {reporte.nota ?? '-'}</div>
        </div>

        <div class="overflow-x-auto flex-1 max-h-[60vh] mb-3">
          <table class="min-w-full border text-base rounded-lg overflow-hidden shadow">
            <thead class="bg-gray-200">
              <tr>
                <th class="p-3 text-left">Producto</th>
                <th class="p-3 text-left">SKU</th>
                <th class="p-3 text-right">Cantidad</th>
                <th class="p-3 text-right">Precio Unitario</th>
                <th class="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <For each={reporte.productos}>
                {(item) => (
                  <tr class="border-b last:border-none hover:bg-gray-50">
                    <td class="p-3">{item.producto?.nombre ?? '-'}</td>
                    <td class="p-3">{item.producto?.sku ?? '-'}</td>
                    <td class="p-3 text-right font-mono">{item.cantidad}</td>
                    <td class="p-3 text-right">
                      {item.producto?.costoDux
                        ? formatearPrecio(item.producto.costoDux)
                        : "-"}
                    </td>
                    <td class="p-3 text-right font-semibold">
                      {item.cantidad && item.producto?.costoDux
                        ? formatearPrecio(item.cantidad * item.producto.costoDux)
                        : "-"}
                    </td>
                  </tr>
                )}
              </For>
              <tr class="bg-gray-100 border-t-2 border-gray-300">
                <td class="p-3 font-bold text-right" colSpan={4}>
                  Total
                </td>
                <td class="p-3 text-right font-bold text-lg">
                  {formatearPrecio(total())}
                </td>
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
