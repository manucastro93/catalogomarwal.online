import { Show, For, createResource, createMemo } from "solid-js";
import { formatearFechaCorta, formatearPrecio } from "@/utils/formato";
import type { FacturaDux, DetalleFacturaDux } from "@/types/factura";
import { obtenerDetalleFacturaDux } from "@/services/factura.service";

export default function VerFacturaDuxModal(props: {
  factura: FacturaDux | null;
  onClose: () => void;
}) {
  const [detalles] = createResource(
    () => props.factura?.id,
    async (id) => (id ? await obtenerDetalleFacturaDux(id) : [])
  );

  const totales = createMemo(() => {
    const dets = detalles() || [];
    let netoSinDesc = 0;
    let netoConDesc = 0;
    let ivaTotal = 0;

    for (const d of dets) {
      const subSinDesc = d.precio_uni * d.ctd;
      const subConDesc = (d.precio_uni * (1 - d.porc_desc / 100)) * d.ctd;
      const iva = subConDesc * (d.porc_iva / 100);

      netoSinDesc += subSinDesc;
      netoConDesc += subConDesc;
      ivaTotal += iva;
    }

    return {
      netoSinDesc,
      netoConDesc,
      ivaTotal,
      totalCalc: netoConDesc + ivaTotal,
    };
  });

  if (!props.factura) return null;

  const cliente = props.factura.apellido_razon_soc
    ? `${props.factura.apellido_razon_soc} ${props.factura.nombre ?? ""}`.trim()
    : props.factura.nombre ?? "-";

  const nroCompleto = `${props.factura.tipo_comp ?? ""} ${props.factura.letra_comp ?? ""} ${props.factura.nro_pto_vta ?? ""}-${String(props.factura.nro_comp ?? "").padStart(8, "0")}`.trim();

  return (
    <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">Factura {nroCompleto}</h2>

        <div class="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><b>Cliente:</b> {cliente}</div>
          <div><b>Vendedor:</b> {props.factura.personal?.nombre} {props.factura.personal?.apellido_razon_social}</div>
          <div><b>Fecha:</b> {formatearFechaCorta(props.factura.fecha_comp)}</div>
          <div><b>Total:</b> {formatearPrecio(props.factura.total)}</div>
          <div><b>Total:</b> {formatearPrecio(totales().totalCalc)}</div>
        </div>

        <Show when={!detalles.loading} fallback={<p class="text-gray-500 text-sm">Cargando ítems…</p>}>
          <Show when={detalles()?.length} fallback={<p class="text-gray-500 text-sm">Sin ítems.</p>}>
            <table class="w-full text-sm border">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left p-2">Código</th>
                  <th class="text-left p-2">Descripción</th>
                  <th class="text-right p-2">Cantidad</th>
                  <th class="text-right p-2">Precio Unit.</th>
                  <th class="text-right p-2">Desc. %</th>
                  <th class="text-right p-2">Subtotal s/Desc</th>
                  <th class="text-right p-2">Subtotal c/Desc</th>
                </tr>
              </thead>
              <tbody>
                <For each={detalles()}>
                  {(d) => {
                    const subSinDesc = d.precio_uni * d.ctd;
                    const subConDesc = (d.precio_uni * (1 - d.porc_desc / 100)) * d.ctd;
                    return (
                      <tr>
                        <td class="p-2">{d.cod_item}</td>
                        <td class="p-2">{d.item}</td>
                        <td class="p-2 text-right">{d.ctd}</td>
                        <td class="p-2 text-right">{formatearPrecio(d.precio_uni)}</td>
                        <td class="p-2 text-right">{d.porc_desc}%</td>
                        <td class="p-2 text-right">{formatearPrecio(subSinDesc)}</td>
                        <td class="p-2 text-right">{formatearPrecio(subConDesc)}</td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </Show>
        </Show>

        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
          </div>
          <div class="text-right">
            <p><b>Neto s/Desc:</b> {formatearPrecio(totales().netoSinDesc)}</p>
            <p><b>Neto c/Desc:</b> {formatearPrecio(totales().netoConDesc)}</p>
            <p><b>IVA:</b> {formatearPrecio(props.factura.monto_iva)}</p>
            <p class="text-lg font-semibold"><b>Total Final:</b> {formatearPrecio(totales().totalCalc + (props.factura.monto_iva || 0))}</p>
          </div>
        </div>

        <div class="mt-6 text-right">
          <button onClick={props.onClose} class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
