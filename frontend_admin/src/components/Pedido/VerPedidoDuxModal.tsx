import { createResource, Show, For } from "solid-js";
import { formatearFechaCorta, formatearPrecio } from "@/utils/formato";
import type { PedidoDux } from "@/types/pedido";
import { obtenerDetallesPedidoDux } from "@/services/pedido.service";

interface DetallePedidoDux {
  codItem: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento?: number;
}

export default function VerPedidoDuxModal(props: {
  pedido: PedidoDux | null;
  onClose: () => void;
}) {
  const [detalles] = createResource(
  () => props.pedido,
  async (pedido) => {
    if (!pedido) return [];
    const res = await obtenerDetallesPedidoDux(pedido.id);
    return res;
  }
);


  if (!props.pedido) return null;

  return (
    <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
          Detalle Pedido Dux #{props.pedido.nro_pedido}
        </h2>

        <div class="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><b>Cliente:</b> {props.pedido.cliente}</div>
          <div><b>Estado:</b> {props.pedido.estado_facturacion}</div>
          <div><b>Vendedor:</b> {props.pedido.nombre_vendedor} {props.pedido.apellido_vendedor}</div>
          <div><b>Fecha:</b> {formatearFechaCorta(props.pedido.fecha)}</div>
          <div><b>Total:</b> {formatearPrecio(Number(props.pedido.total))}</div>
        </div>

        <Show when={!detalles.loading} fallback={<p class="text-gray-500 text-sm">Cargando detalles...</p>}>
            <Show when={detalles()?.length > 0} fallback={<p class="text-gray-500 text-sm">Sin ítems cargados.</p>}>
                <table class="w-full text-sm border">
                <thead class="bg-gray-100">
                    <tr>
                    <th class="text-left p-2">Código</th>
                    <th class="text-left p-2">Descripción</th>
                    <th class="text-right p-2">Cantidad</th>
                    <th class="text-right p-2">Precio Unitario</th>
                    <th class="text-right p-2">Subtotal</th>
                    <th class="text-right p-2">Descuento</th>
                    <th class="text-right p-2">Subtotal c/Desc</th>
                    </tr>
                </thead>
                <tbody>
                    <For each={detalles()}>
                    {(d) => (
                        <tr>
                        <td class="p-2">{d.codItem}</td>
                        <td class="p-2">{d.descripcion}</td>
                        <td class="p-2 text-right">{d.cantidad}</td>
                        <td class="p-2 text-right">{formatearPrecio(d.precioUnitario)}</td>
                        <td class="p-2 text-right">{formatearPrecio(d.subtotal)}</td>
                        <td class="p-2 text-right">{d.descuento ? (d.descuento) : '0'}%</td>
                        <td class="p-2 text-right">{formatearPrecio((d.precioUnitario-(d.precioUnitario*d.descuento/100))*d.cantidad)}</td>
                        </tr>
                    )}
                    </For>
                </tbody>
                </table>
            </Show>
        </Show>



        <div class="mt-6 text-right">
          <button
            onClick={props.onClose}
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}