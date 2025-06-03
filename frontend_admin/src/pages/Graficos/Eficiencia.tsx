import { createSignal, createResource, onMount, Show } from "solid-js";
import { obtenerCategorias } from "@/services/categoria.service";
import {
  fetchResumenEjecutivo,
  fetchEvolucionEficiencia,
  fetchEvolucionFillRate,
  fetchEficienciaPorPedido,
  fetchEficienciaPorCategoria,
  fetchEficienciaPorProducto,
  fetchEficienciaPorCliente,
  fetchEvolucionEficienciaMensual,
  fetchEvolucionEficienciaMensualPorCliente,
} from "@/services/eficiencia.service";
import FiltrosEficiencia from "@/components/Grafico/Eficiencia/FiltrosEficiencia";
import ResumenTextoEficiencia from "@/components/Grafico/Eficiencia/ResumenTextoEficiencia";
import TablaEficiencia from "@/components/Grafico/Eficiencia/TablaEficiencia";
import GraficosEficiencia from "@/components/Grafico/Eficiencia/GraficosEficiencia";
import ModalDetalleEficiencia from "@/components/Grafico/Eficiencia/ModalDetalleEficiencia";
import ModalDetallePedido from "@/components/Grafico/Eficiencia/ModalDetallePedido";
import { exportarDatosAExcel } from "@/utils/exportarDatosAExcel";

export type ModoEficiencia = "pedido" | "categoria" | "producto" | "cliente";

export default function Eficiencia() {
  const today = new Date();
  const primerDiaMes = new Date(today.getFullYear(), today.getMonth(), 1);

  const [desde, setDesde] = createSignal(
    primerDiaMes.toISOString().slice(0, 10)
  );
  const [hasta, setHasta] = createSignal(today.toISOString().slice(0, 10));
  const [categoriaId, setCategoriaId] = createSignal("");
  const [producto, setProducto] = createSignal("");
  const [cliente, setCliente] = createSignal("");
  const [modo, setModo] = createSignal<ModoEficiencia>("cliente");
  const [page, setPage] = createSignal(1);

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [detalleModal, setDetalleModal] = createSignal<{
    modo: ModoEficiencia;
    filtro: string;
  }>({ modo: "producto", filtro: "" });

  const [modalPedidoAbierto, setModalPedidoAbierto] = createSignal(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = createSignal<
    number | null
  >(null);

  const limit = 10;
  const [categorias] = createResource(obtenerCategorias);

  const [resumen] = createResource(
    () => ({ desde: desde(), hasta: hasta() }),
    fetchResumenEjecutivo
  );


  const [evolucionEficiencia] = createResource(
    () => ({ desde: desde(), hasta: hasta() }),
    fetchEvolucionEficiencia
  );
  const [evolucionFillRate] = createResource(
    () => ({ desde: desde(), hasta: hasta() }),
    fetchEvolucionFillRate
  );

  function fetchDetalleActual() {
    const filtros = {
      desde: desde(),
      hasta: hasta(),
      categoriaId: categoriaId(),
      producto: producto(),
      cliente: cliente(),
    };
    if (modo() === "categoria") return fetchEficienciaPorCategoria(filtros);
    if (modo() === "producto") return fetchEficienciaPorProducto(filtros);
    if (modo() === "cliente") return fetchEficienciaPorCliente(filtros);
    return fetchEficienciaPorPedido(filtros);
  }

  const [detalleEficiencia] = createResource(
    () => [modo(), desde(), hasta(), categoriaId(), producto(), cliente()],
    fetchDetalleActual
  );

  function actualizarFiltros() {
    setPage(1);
  }

  function limpiarFiltros() {
    setDesde(primerDiaMes.toISOString().slice(0, 10));
    setHasta(today.toISOString().slice(0, 10));
    setCategoriaId("");
    setProducto("");
    setCliente("");
    setModo("pedido");
    setPage(1);
  }

  async function exportarResumenEficiencia() {
    const dataCompleta = await fetchEficienciaPorPedido({
      desde: desde(),
      hasta: hasta(),
    });
    const columnas = [
      { label: "Pedido", key: "nroPedido" },
      { label: "Fecha", key: "fecha" },
      { label: "Lead Time (días)", key: "leadTimeDias" },
      { label: "Fill Rate (%)", key: "fillRate" },
      { label: "Pedidas", key: "cantidadPedida" },
      { label: "Facturadas", key: "cantidadFacturada" },
    ];
    exportarDatosAExcel(dataCompleta, columnas, "Reporte Eficiencia");
  }

  function abrirModalDetalle(modoDetalle: ModoEficiencia, filtro: string) {
    if (modoDetalle === "pedido") {
      setPedidoSeleccionado(Number(filtro));
      setModalPedidoAbierto(true);
    } else {
      setDetalleModal({ modo: modoDetalle, filtro });
      setModalAbierto(true);
    }
  }
  const [datosMensual] = createResource(
    () => [cliente()],
    async ([cliente]) => {
      if (cliente.trim()) {
        return await fetchEvolucionEficienciaMensualPorCliente(cliente);
      }
      return await fetchEvolucionEficienciaMensual();
    }
  );
  onMount(actualizarFiltros);

  return (
    <div class="w-full max-w-screen-xl mx-auto px-3 py-4 md:p-6 space-y-6 md:space-y-8">
      <h1 class="text-lg md:text-2xl font-bold mb-4 text-center">
        Servicio Comercial 📦
      </h1>

      <FiltrosEficiencia
        desde={desde()}
        hasta={hasta()}
        categoriaId={categoriaId()}
        producto={producto()}
        cliente={cliente()}
        modo={modo()}
        categorias={categorias() || []}
        setDesde={(v) => {
          setDesde(v);
          actualizarFiltros();
        }}
        setHasta={(v) => {
          setHasta(v);
          actualizarFiltros();
        }}
        setCategoriaId={(v) => {
          setCategoriaId(v);
          actualizarFiltros();
        }}
        setProducto={(v) => {
          setProducto(v);
          actualizarFiltros();
        }}
        setCliente={(v) => {
          setCliente(v);
          actualizarFiltros();
        }}
        setModo={(v) => {
          setModo(v);
          actualizarFiltros();
        }}
        limpiarFiltros={limpiarFiltros}
        onExportar={exportarResumenEficiencia}
      />

      <ResumenTextoEficiencia
        desde={desde}
        hasta={hasta}
        resumen={resumen}
      />



      <Show
        when={
          !evolucionEficiencia.loading &&
          !evolucionFillRate.loading &&
          !detalleEficiencia.loading
        }
        fallback={
          <div class="p-6 text-center text-gray-500 text-sm">
            Cargando datos de gráficos...
          </div>
        }
      >
        <GraficosEficiencia
          evolucionEficiencia={[...evolucionEficiencia()!].sort(
            (a, b) => a.leadTime - b.leadTime
          )}
          evolucionFillRate={[...evolucionFillRate()!].sort(
            (a, b) => a.fillRate - b.fillRate
          )}
          datosMensual={datosMensual() || []}
          datosPedidos={modo() === "pedido" ? detalleEficiencia()! : []}
          datosCategorias={
            modo() === "categoria"
              ? detalleEficiencia()!.map((d: any) => ({
                ...d,
                categoria:
                  categorias()?.find((c: any) => c.id == d.categoria)
                    ?.nombre || "Sin nombre",
              }))
              : []
          }
          datosProductos={modo() === "producto" ? detalleEficiencia()! : []}
          datosClientes={modo() === "cliente" ? detalleEficiencia()! : []}
          filtros={{
            categoriaId: categoriaId(),
            producto: producto(),
            nroPedido: "",
            cliente: cliente(),
          }}
          modo={modo()}
        />
      </Show>

      <Show
        when={!detalleEficiencia.loading && detalleEficiencia()}
        fallback={
          <div class="p-6 text-center text-gray-500 text-sm">
            Cargando datos de tabla...
          </div>
        }
      >
        <TablaEficiencia
          datos={(() => {
            const datos = detalleEficiencia()!;
            switch (modo()) {
              case "cliente":
                return [...datos].sort((a, b) =>
                  a.cliente.localeCompare(b.cliente)
                );
              case "pedido":
                return datos;
              case "categoria":
                return datos.map((d: any) => ({
                  ...d,
                  categoria: d.categoria || "Sin categoría",
                }));
              case "producto":
                return datos.map((d: any) => ({
                  ...d,
                  producto: d.descripcion ?? d.codItem ?? "Sin nombre",
                }));
              default:
                return [];
            }
          })()}
          modo={modo()}
          onSeleccionar={(item: any) => {
            const filtro =
              modo() === "categoria"
                ? item.categoria
                : modo() === "producto"
                  ? item.producto
                  : modo() === "cliente"
                    ? item.cliente
                    : modo() === "pedido"
                      ? item.nroPedido
                      : "";
            abrirModalDetalle(modo(), filtro);
          }}
        />
      </Show>

      <Show when={modalAbierto()}>
        <ModalDetalleEficiencia
          abierto={modalAbierto()}
          onCerrar={() => setModalAbierto(false)}
          desde={desde()}
          hasta={hasta()}
          modo={detalleModal().modo}
          filtro={detalleModal().filtro}
        />
      </Show>

      <Show when={modalPedidoAbierto() && pedidoSeleccionado() !== null}>
        <ModalDetallePedido
          pedidoId={pedidoSeleccionado()!}
          abierto={modalPedidoAbierto()}
          onCerrar={() => setModalPedidoAbierto(false)}
        />
      </Show>
    </div>
  );
}
