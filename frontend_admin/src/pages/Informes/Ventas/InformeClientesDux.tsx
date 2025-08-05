import { createMemo, createResource, createSignal, Show } from "solid-js";
import FiltrosClientesDux from "@/components/InformeClientesDux/FiltrosClientesDux";
import GraficoBarras from "@/components/InformeClientesDux/GraficoBarras";
import GraficoLineas from "@/components/InformeClientesDux/GraficoLineas";
import TablaClientesDux from "@/components/InformeClientesDux/TablaClientes";
import ReporteEjecutivoClientesDux from "@/components/InformeClientesDux/ReporteEjecutivoClientesDux";
import GraficoPedidosPorMes from "@/components/InformeClientesDux/GraficoPedidosPorMes";
import dayjs from "dayjs";

import {
  obtenerInformeClientesDux,
  obtenerListasPrecioClientesDux,
} from "@/services/clienteDux.service";
import { obtenerPedidosPorMesConVendedor } from "@/services/estadisticas.service";
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

  const filtrosPedidos = createMemo(() => {
    const hoy = dayjs().format("YYYY-MM-DD");
    return {
      desde: fechaDesde() || "2023-11-01",
      hasta: fechaHasta() || hoy,
      vendedor: vendedor() || undefined,
    };
  });

  const [graficoPedidosData] = createResource(filtrosPedidos, ({ desde, hasta, vendedor }) => {
    console.log("📦 Refetch pedidos con:", { desde, hasta, vendedor });
    return obtenerPedidosPorMesConVendedor(desde, hasta, vendedor);
  });

  const fetchParams = () => ({
    fechaDesde: fechaDesde() || undefined,
    fechaHasta: fechaHasta() || undefined,
    vendedor: vendedor() || undefined,
    listaPrecio: listaPrecio() || undefined,
    page: pagina(),
  });

  const [datos, { refetch }] = createResource(fetchParams, obtenerInformeClientesDux);

  const onAplicarFiltros = () => {
    setPagina(1);
    refetch(); // el gráfico ya se reactiva solo por las señales
  };

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Informe de Clientes Nuevos</h1>

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

      <Show when={datos()?.porMes}>
        <GraficoBarras data={datos()!.porMes} />
      </Show>

      <Show when={graficoPedidosData()}>
        <GraficoPedidosPorMes data={graficoPedidosData()!} />
      </Show>

      {/* <Show when={datos()?.porDia}>
        <GraficoLineas data={datos()!.porDia} />
      </Show> */}

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
