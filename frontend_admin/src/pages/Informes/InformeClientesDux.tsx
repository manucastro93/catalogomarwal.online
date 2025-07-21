import { createResource, createSignal, Show } from "solid-js";
import FiltrosClientesDux from "@/components/InformeClientesDux/FiltrosClientesDux";
import GraficoBarras from "@/components/InformeClientesDux/GraficoBarras";
import GraficoLineas from "@/components/InformeClientesDux/GraficoLineas";
import TablaClientesDux from "@/components/InformeClientesDux/TablaClientes";
import ReporteEjecutivoClientesDux from "@/components/InformeClientesDux/ReporteEjecutivoClientesDux";

import {
  obtenerInformeClientesDux,
  obtenerListasPrecioClientesDux,
} from "@/services/clienteDux.service";
import { obtenerPersonalDux } from "@/services/personalDux.service";
import type { ClienteDux } from "@/types/clienteDux";
import type { VendedorOption } from "@/types/vendedor";

export default function InformeClientesDux() {
  const [fechaDesde, setFechaDesde] = createSignal<string | null>(null);
  const [fechaHasta, setFechaHasta] = createSignal<string | null>(null);
  const [vendedor, setVendedor] = createSignal("");
  const [listaPrecio, setListaPrecio] = createSignal("");
  const [pagina, setPagina] = createSignal(1);

  const [vendedores] = createResource(obtenerPersonalDux);
  const [listasPrecio] = createResource(obtenerListasPrecioClientesDux);

  // 🚦 Siempre pasar page, aunque sea 1
  const fetchParams = () => ({
    fechaDesde: fechaDesde() || undefined,
    fechaHasta: fechaHasta() || undefined,
    vendedor: vendedor() || undefined,
    listaPrecio: listaPrecio() || undefined,
    page: pagina(),
  });

  const [datos, { refetch }] = createResource(fetchParams, obtenerInformeClientesDux);

  // Cuando se aplican filtros, volver a la página 1 y refrescar
  const onAplicarFiltros = () => {
    setPagina(1);
    refetch();
  };

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Informe de Clientes Dux</h1>

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

      <ReporteEjecutivoClientesDux />

      {/* 📊 Gráfico de barras: SIEMPRE datos totales */}
      <Show when={datos()?.porMes}>
        <GraficoBarras data={datos()!.porMes} />
      </Show>

      {/* 📈 Gráfico de líneas: datos filtrados */}
      <Show when={datos()?.porDia}>
        <GraficoLineas data={datos()!.porDia} />
      </Show>

      {/* 📋 Tabla detalle paginada */}
      <Show when={datos()?.detalle}>
        <TablaClientesDux
          clientes={datos()!.detalle as ClienteDux[]}
          pagina={pagina()}
          totalPaginas={datos()!.totalPaginas}
          onPaginaChange={(nueva) => {
            setPagina(nueva);
            refetch();
          }}
        />
      </Show>
    </div>
  );
}
