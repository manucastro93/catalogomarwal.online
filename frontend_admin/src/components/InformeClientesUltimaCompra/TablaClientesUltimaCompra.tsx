import { createSignal, For, Show } from "solid-js";
import type { ClienteDuxConUltimaCompra } from "@/types/clienteDux";
import type { PedidoDux } from "@/types/pedido";
import { formatearFechaCorta } from "@/utils/formato";
import VerPedidoDuxModal from "@/components/InformeClientesUltimaCompra/VerPedidoDuxModal";
import { obtenerPedidoPorClienteYFecha } from "@/services/pedido.service";

export default function TablaClientesUltimaCompra(props: {
  clientes: ClienteDuxConUltimaCompra[];
  pagina: number;
  totalPaginas: number;
  orden: keyof ClienteDuxConUltimaCompra;
  direccion: 'ASC' | 'DESC';
  onOrdenar: (col: keyof ClienteDuxConUltimaCompra) => void;
  onPaginaChange: (nueva: number) => void;
}) {
  const [pedido, setPedido] = createSignal<PedidoDux | null>(null);

  const abrirUltimaCompra = async (cliente: string, fechaUltimaCompra?: string) => {
    if (!cliente || !fechaUltimaCompra) return;
    const pedidoEncontrado = await obtenerPedidoPorClienteYFecha(cliente, fechaUltimaCompra);
    if (pedidoEncontrado?.id) setPedido(pedidoEncontrado);
  };

  return (
    <div class="overflow-auto border rounded-lg mt-15">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('fechaUltimaCompra')}>Fecha Última Compra</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('cliente')}>Cliente</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('cuitCuil')}>CUIT</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('listaPrecioPorDefecto')}>Lista de Precio</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('vendedor')}>Vendedor</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('provincia')}>Provincia</th>
            <th class="text-left p-3 border-b cursor-pointer" onClick={() => props.onOrdenar('localidad')}>Localidad</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.clientes.length}
            fallback={
              <tr>
                <td colspan="7" class="text-center p-4 text-gray-500">
                  No se encontraron clientes
                </td>
              </tr>
            }
          >
            <For each={props.clientes}>
              {(c) => (
                <tr
                  class="hover:bg-gray-50 border-b cursor-pointer"
                  onClick={() => abrirUltimaCompra(c.cliente, c.fechaUltimaCompra ?? '')}
                >
                  <td class="p-3">{formatearFechaCorta(c.fechaUltimaCompra)}</td>
                  <td class="p-3 truncate max-w-[250px]" title={c.cliente}>{c.cliente}</td>
                  <td class="p-3">{c.cuitCuil}</td>
                  <td class="p-3">{c.listaPrecioPorDefecto}</td>
                  <td class="p-3">{c.vendedor}</td>
                  <td class="p-3">{c.provincia}</td>
                  <td class="p-3">{c.localidad}</td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>

      {/* Paginación */}
      <div class="flex justify-center items-center gap-2 p-4">
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => props.onPaginaChange(props.pagina - 1)}
          disabled={props.pagina <= 1}
        >
          Anterior
        </button>
        <span class="text-sm">
          Página {props.pagina} de {props.totalPaginas}
        </span>
        <button
          class="px-3 py-1 border rounded disabled:opacity-50"
          onClick={() => props.onPaginaChange(props.pagina + 1)}
          disabled={props.pagina >= props.totalPaginas}
        >
          Siguiente
        </button>
      </div>

      <Show when={pedido()}>
        <VerPedidoDuxModal pedido={pedido()!} onClose={() => setPedido(null)} />
      </Show>
    </div>
  );
}
