import { createResource, Show, For, createSignal } from "solid-js";
import { formatearMiles, formatearFechaCorta, formatearPrecio } from "@/utils/formato";
import {
  fetchDetalleProducto,
  fetchDetalleCliente,
  fetchDetalleCategoria,
} from "@/services/eficiencia.service";
import ModalDetallePedido from "./ModalDetallePedido";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  modo: "categoria" | "cliente" | "producto";
  filtro: string;
  nombreFiltro: string;
  desde: string;
  hasta: string;
}

export default function ModalDetalleEficiencia({
  abierto,
  onCerrar,
  modo,
  filtro,
  nombreFiltro,
  desde,
  hasta,
}: Props) {
  const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<
    number | null
  >(null);
  const [verModalPedido, setVerModalPedido] = createSignal(false);

  const fetch = () => {
    const filtros = { desde, hasta };
    if (modo === "cliente") {
      return fetchDetalleCliente({ ...filtros, cliente: filtro }); 
    }
    if (modo === "categoria") {
      return fetchDetalleCategoria({ ...filtros, categoriaId: filtro });
    }
    return fetchDetalleProducto({ ...filtros, producto: filtro });
  };

  const [datos] = createResource([modo, filtro, desde, hasta], fetch);

  const abrirDetallePedido = (item: any) => {
    if (item?.pedidoId) {
      setPedidoSeleccionado(item.pedidoId);
      setVerModalPedido(true);
    } else if (item?.nroPedido) {
      setPedidoSeleccionado(item.nroPedido);
      setVerModalPedido(true);
    }
  };


  return (
    <Show when={abierto}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 md:mx-8">
          <div class="flex justify-between items-center px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">
              Detalle por {modo} – {nombreFiltro || filtro}
            </h2>
            <button
              class="text-gray-600 hover:text-gray-900 text-xl"
              onClick={onCerrar}
            >
              &times;
            </button>
          </div>

          <div class="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Show when={!datos.loading && datos()}>
              <table class="min-w-full text-sm text-left">
                <thead class="bg-gray-100 text-xs uppercase text-gray-600 sticky top-0">
                  <tr>
                    <th class="px-4 py-2">Pedido</th>
                    <th class="px-4 py-2">Fecha Pedido</th>
                    <th class="px-4 py-2">Fecha Factura</th>
                    <th class="px-4 py-2">Cant. Pedida</th>
                    <th class="px-4 py-2">Cant. Facturada</th>
                    <th class="px-4 py-2">Fill Rate</th>
                    <th class="px-4 py-2">$. Pedida</th>
                    <th class="px-4 py-2">$. Facturada</th>
                    <th class="px-4 py-2">FR Ponderado</th>
                    <th class="px-4 py-2">Lead Time (días)</th>
                  </tr>
                </thead>
                <tbody>
                  <For
                    each={datos()
                      .slice()
                      .sort(
                        (a: any, b: any) =>
                          Number(a.nroPedido ?? 0) - Number(b.nroPedido ?? 0)
                      )}
                  >
                    {(item: any) => (
                      <tr
                        class="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() => abrirDetallePedido(item)}
                      >
                        <td class="px-4 py-2">{item.nroPedido || "—"}</td>
                        {/* ✅ CORRECCIÓN: Fecha Pedido ya viene formateada del backend */}
                        <td class="px-4 py-2 whitespace-nowrap">
                          {(item.fechaPedido) || (item.fechaPedido)}
                        </td>
                        {/* ✅ CORRECCIÓN: Fecha Factura con lógica de truncado y tooltip */}
                       <td class="px-4 py-2 whitespace-nowrap">
                          {Array.isArray(item.fechasFacturas) && item.fechasFacturas.length > 0 ? (
                            item.fechasFacturas.length > 2 ? (
                              <span title={item.fechasFacturas.join(', ')}>
                                {`${item.fechasFacturas.length} fechas`}
                              </span>
                            ) : (
                              item.fechasFacturas.join(', ')
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td class="px-4 py-2">
                          {formatearMiles(item.cantidadPedida)}
                        </td>
                        <td class="px-4 py-2">
                          {formatearMiles(item.cantidadFacturada)}
                        </td>
                        <td class="px-4 py-2">{item.fillRate?.toFixed(2)}%</td>
                        <td class="px-4 py-2">
                          {formatearPrecio(item.totalPedido)}
                        </td>
                        <td class="px-4 py-2">
                          {formatearPrecio(item.totalFacturado)}
                        </td>
                        <td class="px-4 py-2">{item.fillRatePonderado?.toFixed(2)}%</td>
                        <td class="px-4 py-2">
                          {item.leadTimeDias?.toFixed(2) ?? "—"}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>

            <Show when={datos.loading}>
              <div class="p-6 text-center text-gray-500">
                Cargando detalle...
              </div>
            </Show>
          </div>

          <div class="p-4 text-right">
            <button
              onClick={onCerrar}
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Asegúrate de que ModalDetallePedido recibe el ID correcto.
            Si item.nroPedido es lo que estás pasando en modo 'categoria',
            y ModalDetallePedido espera 'pedidoId' (el ID interno de la tabla PedidoDux),
            entonces necesitarás un ajuste en el service de 'categoria'
            para que devuelva también el pedidoId interno.
        */}
        <Show when={verModalPedido()}>
          <ModalDetallePedido
            pedidoId={pedidoSeleccionado()!}
            abierto={verModalPedido()}
            onCerrar={() => setVerModalPedido(false)}
          />
        </Show>
      </div>
    </Show>
  );
}