
import { createSignal, createResource, onMount, Show } from "solid-js";
import { obtenerCategorias } from "@/services/categoria.service";
import {
  fetchResumenEjecutivo,
  fetchEficienciaPorPedido,
  fetchEficienciaPorCategoria,
  fetchEficienciaPorProducto,
  fetchEficienciaPorCliente,
  fetchEvolucionEficienciaMensual,
} from "@/services/eficiencia.service";
import FiltrosEficiencia from "@/components/Grafico/Eficiencia/FiltrosEficiencia";
import ResumenTextoEficiencia from "@/components/Grafico/Eficiencia/ResumenTextoEficiencia";
import TablaEficiencia from "@/components/Grafico/Eficiencia/TablaEficiencia";
import GraficosEficiencia from "@/components/Grafico/Eficiencia/GraficosEficiencia";
import ModalDetalleEficiencia from "@/components/Grafico/Eficiencia/ModalDetalleEficiencia";
import ModalDetallePedido from "@/components/Grafico/Eficiencia/ModalDetallePedido";
import { exportarDatosAExcel } from "@/utils/exportarDatosAExcel";
import { formatearFechaCorta } from "@/utils/formato";

export type ModoEficiencia = "categoria" | "producto" | "cliente";

export default function Eficiencia() {
  const today = new Date();
  const primerDiaMes = new Date(today.getFullYear(), today.getMonth(), 1);

  const [desde, setDesde] = createSignal(primerDiaMes.toISOString().slice(0, 10));
  const [hasta, setHasta] = createSignal(today.toISOString().slice(0, 10));
  const [categoriaId, setCategoriaId] = createSignal("");
  const [producto, setProducto] = createSignal("");
  const [cliente, setCliente] = createSignal("");
  const [modo, setModo] = createSignal<ModoEficiencia>("cliente");
  const [page, setPage] = createSignal(1);
  const [nombreFiltro, setNombreFiltro] = createSignal("");
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [detalleModal, setDetalleModal] = createSignal<{ modo: ModoEficiencia; filtro: string }>({ modo: "producto", filtro: "" });
  const [modalPedidoAbierto, setModalPedidoAbierto] = createSignal(false);

  const limit = 10;
  const [categorias] = createResource(obtenerCategorias);

  const [resumen] = createResource(
    () => ({ desde: desde(), hasta: hasta() }),
    fetchResumenEjecutivo
  );

  const [evolucionMensual] = createResource(
    () => ({ desde: "2015-01-01", hasta: hasta(), cliente: cliente() }),
    fetchEvolucionEficienciaMensual
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
    setPage(1);
  }

async function exportarDetalleEficiencia() {
  const datos = detalleEficiencia() || [];
  const desdeTexto = formatearFechaCorta(desde());
  const hastaTexto = formatearFechaCorta(hasta());
  const rangoFechas = `${desdeTexto} a ${hastaTexto}`;
  let columnas: { label: string; key: string }[] = [];
  let nombreArchivo = `Detalle eficiencia por ${modo()}`;

  switch (modo()) {
    case "cliente":
      columnas = [
        { label: "Cliente", key: "cliente" },
        { label: "Cant. Pedida", key: "cantidadPedida" },
        { label: "Cant. Facturada", key: "cantidadFacturada" },
        { label: "Fill Rate", key: "fillRate" },
        { label: "Fill Rate Ponderado", key: "fillRatePonderado" },
        { label: "Lead Time (días)", key: "leadTimePromedio" },
      ];
      break;
    case "producto":
      columnas = [
        { label: "SKU", key: "codItem" },
        { label: "Producto", key: "producto" },
        { label: "Cant. Pedida", key: "cantidadPedida" },
        { label: "Cant. Facturada", key: "cantidadFacturada" },
        { label: "Fill Rate", key: "fillRate" },
        { label: "Fill Rate Ponderado", key: "fillRatePonderado" },
        { label: "Lead Time (días)", key: "leadTimePromedio" },
      ];
      break;
    case "categoria":
      columnas = [
        { label: "Categoría", key: "categoriaNombre" },
        { label: "Cant. Pedida", key: "cantidadPedida" },
        { label: "Cant. Facturada", key: "cantidadFacturada" },
        { label: "Fill Rate", key: "fillRate" },
        { label: "Fill Rate Ponderado", key: "fillRatePonderado" },
        { label: "Lead Time (días)", key: "leadTimePromedio" },
      ];
      break;
  }

  const datosFormateados = datos.map((item: any) => ({ ...item }));

  exportarDatosAExcel(datosFormateados, columnas, nombreArchivo, rangoFechas);
}


  function abrirModalDetalle(modoDetalle: ModoEficiencia, filtro: string, nombre?: string) {
    setDetalleModal({ modo: modoDetalle, filtro });
    setNombreFiltro(nombre || filtro);
    setModalAbierto(true);
  }

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
        onExportar={exportarDetalleEficiencia}
      />

      <ResumenTextoEficiencia desde={desde} hasta={hasta} resumen={resumen} />

      <Show
        when={!evolucionMensual.loading && !detalleEficiencia.loading}
        fallback={<div class="p-6 text-center text-gray-500 text-sm">Cargando datos de gráficos...</div>}
      >
        <GraficosEficiencia
          evolucionEficiencia={[...evolucionMensual()!].sort((a, b) => a.leadTime - b.leadTime)}
          evolucionFillRate={[...evolucionMensual()!].sort((a, b) => a.fillRate - b.fillRate)}
          datosMensual={evolucionMensual() || []}
          datosCategorias={
            modo() === "categoria"
              ? detalleEficiencia()!.map((d: any) => ({
                  ...d,
                  categoria: categorias()?.find((c: any) => c.id == d.categoria)?.nombre || "Sin nombre",
                }))
              : []
          }
          datosProductos={modo() === "producto" ? detalleEficiencia()! : []}
          datosClientes={modo() === "cliente" ? detalleEficiencia()! : []}
          filtros={{
            categoriaId: categoriaId(),
            producto: producto(),
            cliente: cliente(),
          }}
          modo={modo()}
        />
      </Show>

      <Show when={!detalleEficiencia.loading && detalleEficiencia()}>
        <TablaEficiencia
          datos={(() => {
            const datos = detalleEficiencia()!;
            switch (modo()) {
              case "cliente":
                return [...datos].sort((a, b) => a.cliente.localeCompare(b.cliente));
              case "categoria":
                return datos.map((d: any) => ({
                  ...d,
                  categoria: d.categoriaId || "Sin categoría",
                  categoriaNombre: d.categoriaNombre || "Sin categoría",
                }));
              case "producto":
                return datos.map((d: any) => ({
                  ...d,
                  codItem: d.codItem,
                  producto: d.producto,
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
                ? item.codItem ?? item.producto
                : modo() === "cliente"
                ? item.cliente
                : "";

            const nombre =
              modo() === "categoria"
                ? item.categoriaNombre
                : modo() === "producto"
                ? item.producto
                : item.cliente;
            abrirModalDetalle(modo(), filtro, nombre);
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
          nombreFiltro={nombreFiltro()}
        />
      </Show>
    </div>
  );
}
