import { createResource, Show, For, createSignal } from "solid-js";
import { formatearMiles, formatearFechaCorta, formatearPrecio } from "@/utils/formato";
import {
  fetchEficienciaPorProducto,
  fetchDetalleCliente,
  fetchDetalleCategoria,
} from "@/services/eficiencia.service";
import ModalDetallePedido from "./ModalDetallePedido"; // Asegúrate de que la ruta sea correcta

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  modo: "categoria" | "cliente" | "producto";
  filtro: string;
  desde: string;
  hasta: string;
}

export default function ModalDetalleEficiencia({
  abierto,
  onCerrar,
  modo,
  filtro,
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
      // Asegúrate de que el nombre del filtro coincida con lo que el service espera
      // Por ejemplo, si el service espera 'clienteNombre', usa 'clienteNombre: filtro'
      return fetchDetalleCliente({ ...filtros, cliente: filtro }); 
    }
    if (modo === "categoria") {
      return fetchDetalleCategoria({ ...filtros, categoriaId: filtro });
    }
    // Asumo que fetchEficienciaPorProducto se llama aquí, aunque su nombre puede sugerir otra cosa.
    // Si esta función retorna el mismo tipo de detalle por pedido, es válido.
    return fetchEficienciaPorProducto({ ...filtros, producto: filtro });
  };

  const [datos] = createResource([modo, filtro, desde, hasta], fetch);

  const abrirDetallePedido = (item: any) => {
    // La propiedad que contiene el ID del pedido varía según el modo:
    // - En modo 'cliente', el ID del pedido es 'pedidoId'
    // - En modo 'categoria', el ID del pedido es 'nroPedido' (asumo que se mapea a un id interno si es necesario para ModalDetallePedido)
    // - En modo 'producto', el ID del pedido puede ser 'pedidoId' o 'nroPedido' dependiendo de cómo lo devuelva el service.
    // Asegúrate de que `ModalDetallePedido` pueda manejar el `pedidoId` o el `nroPedido` según corresponda.
    // Por simplicidad, buscaré tanto 'pedidoId' como 'nroPedido' como un identificador único.
    
    // Si ModalDetallePedido espera el ID interno de la tabla PedidoDux,
    // y tu service en modo 'categoria' o 'producto' no devuelve ese 'id' sino el 'nroPedido',
    // podría necesitar ajuste.
    // Para el detalle por cliente, el service devuelve 'pedidoId'.
    // Para detalle por categoria, el service devuelve 'nroPedido'.
    // Si ModalDetallePedido espera 'id' de PedidoDux, necesitas ajustar fetchDetalleCategoria.
    
    // Por ahora, asumiré que 'item.pedidoId' es el identificador principal para ModalDetallePedido.
    if (item?.pedidoId) { // Priorizamos 'pedidoId' que viene de DetallePorCliente
      setPedidoSeleccionado(item.pedidoId);
      setVerModalPedido(true);
    } else if (item?.nroPedido) { // Si no hay pedidoId, usamos nroPedido (ej. para categoría)
      // ADVERTENCIA: Si ModalDetallePedido solo funciona con el ID interno de PedidoDux y no con nroPedido,
      // esto necesitará que el service de categoria devuelva el 'id' de PedidoDux también.
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
              Detalle por {modo} – {filtro}
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
                          {item.fechaPedido || "—"}
                        </td>
                        {/* ✅ CORRECCIÓN: Fecha Factura con lógica de truncado y tooltip */}
                        <td class="px-4 py-2 whitespace-nowrap">
                          {item.fechasFacturas && item.fechasFacturas !== '—' ? (
                            // Separamos la cadena de fechas por ', ' para contar
                            item.fechasFacturas.split(', ').length > 2
                              ? (
                                // Usamos el atributo 'title' para un tooltip nativo del navegador
                                // El texto visible será "X fechas", el completo estará en el title
                                <span title={item.fechasFacturas}>
                                  {`${item.fechasFacturas.split(', ').length} fechas`}
                                </span>
                              )
                              : item.fechasFacturas // Si son 2 o menos, muestra todas
                          ) : (
                            '—' // Si no hay fechas o es el guion
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