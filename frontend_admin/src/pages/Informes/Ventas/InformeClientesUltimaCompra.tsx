import { createMemo, createResource, createSignal, Show } from "solid-js";
import FiltrosClientesDux from "@/components/InformeClientesDux/FiltrosClientesDux";
import TablaClientesUltimaCompra from "@/components/InformeClientesUltimaCompra/TablaClientesUltimaCompra";
import ReporteEjecutivoUltimaCompra from "@/components/InformeClientesUltimaCompra/ReporteEjecutivoUltimaCompra";
import dayjs from "dayjs";

import {
  obtenerInformeClientesUltimaCompra,
  obtenerListasPrecioClientesDux,
} from "@/services/clienteDux.service";
import { obtenerPersonalDux } from "@/services/personalDux.service";

import type { ClienteDuxConUltimaCompra } from "@/types/clienteDux";
import type { VendedorOption } from "@/types/vendedor";

export default function InformeClientesUltimaCompra() {
  const [fechaDesde, setFechaDesde] = createSignal<string | null>(null);
  const [fechaHasta, setFechaHasta] = createSignal<string | null>(null);
  const [vendedor, setVendedor] = createSignal("");
  const [listaPrecio, setListaPrecio] = createSignal("");
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal<keyof ClienteDuxConUltimaCompra>('fechaUltimaCompra');
  const [direccion, setDireccion] = createSignal<'ASC' | 'DESC'>('ASC');

  const [vendedores] = createResource(obtenerPersonalDux);
  const [listasPrecio] = createResource(obtenerListasPrecioClientesDux);

  const fetchParams = () => ({
    fechaDesde: fechaDesde() || undefined,
    fechaHasta: fechaHasta() || undefined,
    vendedor: vendedor() || undefined,
    listaPrecio: listaPrecio() || undefined,
    page: pagina(),
    orden: orden(),
    direccion: direccion(),
  });

  const [datos, { refetch }] = createResource(fetchParams, obtenerInformeClientesUltimaCompra);

  const onAplicarFiltros = () => {
    setPagina(1);
    refetch();
  };

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Informe de Última Compra por Cliente</h1>

      <Show when={vendedores() && listasPrecio()}>
        <FiltrosClientesDux
          fechaDesde={fechaDesde()}
          fechaHasta={fechaHasta()}
          vendedor={vendedor()}
          listaPrecio={listaPrecio()}
          vendedores={vendedores() as VendedorOption[]}
          listasPrecio={listasPrecio() as string[]}
          onFechaDesde={setFechaDesde}
          onFechaHasta={setFechaHasta}
          onVendedor={setVendedor}
          onListaPrecio={setListaPrecio}
          onAplicar={onAplicarFiltros}
        />
      </Show>

      <ReporteEjecutivoUltimaCompra />

      <Show when={datos()?.detalle}>
        <TablaClientesUltimaCompra
          clientes={datos()!.detalle as ClienteDuxConUltimaCompra[]}
          pagina={pagina()}
          totalPaginas={datos()!.totalPaginas}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={(col) => {
            if (orden() === col) {
              setDireccion(direccion() === 'ASC' ? 'DESC' : 'ASC');
            } else {
              setOrden(col);
              setDireccion('ASC');
            }
            refetch();
          }}
          onPaginaChange={(nueva) => {
            setPagina(nueva);
            refetch();
          }}
        />
      </Show>
    </div>
  );
}
