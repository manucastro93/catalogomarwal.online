import { createSignal, createResource } from "solid-js";
import FiltrosVentas from "@/components/Grafico/ResumenVentas/FiltrosVentas";
import TablaVentas from "@/components/Grafico/ResumenVentas/TablaVentas";
import GraficosVentas from "@/components/Grafico/ResumenVentas/GraficosVentas";
import { exportarDatosAExcel } from "@/utils/exportarDatosAExcel";
import { obtenerPedidos } from "@/services/pedido.service";
import { obtenerRankingEstadisticas, obtenerEstadisticasPorFecha } from "@/services/estadisticas.service";

function obtenerFechasIniciales() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = (hoy.getMonth() + 1).toString().padStart(2, "0");
  const dd = hoy.getDate().toString().padStart(2, "0");
  return {
    desde: `${yyyy}-${mm}-01`,
    hasta: `${yyyy}-${mm}-${dd}`,
  };
}

export default function ResumenVentas() {
  const { desde: fechaInicio, hasta: fechaFin } = obtenerFechasIniciales();

  const [desde, setDesde] = createSignal(fechaInicio);
  const [hasta, setHasta] = createSignal(fechaFin);
  const [cliente, setCliente] = createSignal("");
  const [producto, setProducto] = createSignal("");
  const [categoriaId, setCategoriaId] = createSignal("");
  const [modo, setModo] = createSignal<"valor" | "cantidad">("valor");

  const limpiarFiltros = () => {
    const { desde: d, hasta: h } = obtenerFechasIniciales();
    setDesde(d);
    setHasta(h);
    setCliente("");
    setProducto("");
    setCategoriaId("");
    setModo("valor");
  };

  const [ranking] = createResource(
    () => [desde(), hasta()] as const,
    ([d, h]) => obtenerRankingEstadisticas(d, h)
  );

  const [evolucion] = createResource(
    () => [desde(), hasta()] as const,
    ([d, h]) => obtenerEstadisticasPorFecha(d, h)
  );

  const [respuesta] = createResource(
    () => ({
      desde: desde(),
      hasta: hasta(),
      cliente: cliente(),
      producto: producto(),
      categoriaId: categoriaId(),
      modo: modo(),
      pagina: 1,
      orden: "fecha",
      direccion: "asc",
    }),
    obtenerPedidos
  );

  const onExportar = async () => {
    if (!respuesta()?.data?.length) return;

    exportarDatosAExcel(
      respuesta()!.data,
      [
        { label: "Fecha", key: "fecha" },
        { label: "Cliente", key: "cliente" },
        { label: "Vendedor", key: "vendedor" },
        { label: "Producto", key: "producto" },
        { label: "Cantidad", key: "cantidad" },
        { label: "Total", key: "total" },
        { label: "Comentario", key: "comentario" },
      ],
      `Ventas_${desde()}_a_${hasta()}`
    );
  };

  return (
    <div class="w-full max-w-screen-xl mx-auto px-3 py-4 md:p-6 space-y-6 md:space-y-8">
      <h1 class="text-lg md:text-2xl font-bold mb-4 text-center">
        Resumen de Ventas 📈
      </h1>
      <div class="space-y-4">
        <FiltrosVentas
          desde={desde()}
          hasta={hasta()}
          cliente={cliente()}
          producto={producto()}
          categoriaId={categoriaId()}
          modo={modo()}
          setDesde={setDesde}
          setHasta={setHasta}
          setCliente={setCliente}
          setProducto={setProducto}
          setCategoriaId={setCategoriaId}
          setModo={setModo}
          limpiarFiltros={limpiarFiltros}
          onExportar={onExportar}
        />

        <GraficosVentas
          desde={desde()}
          hasta={hasta()}
          cliente={cliente()}
          producto={producto()}
          categoriaId={categoriaId()}
          modo={modo()}
          ranking={ranking()}
          evolucion={evolucion() || []}
        />

        <TablaVentas
          items={
            (respuesta()?.data || []).flatMap((pedido) =>
              (pedido.detalles || []).map((detalle) => ({
                fecha: new Date(pedido.createdAt).toLocaleDateString(),
                cliente: pedido.cliente?.nombre || "—",
                vendedor: pedido.usuario?.nombre || "—",
                producto: detalle.producto?.nombre || "—",
                cantidad: detalle.cantidad,
                total: detalle.precioUnitario * detalle.cantidad,
                comentario: pedido.observaciones || "—",
              }))
            )
          }
          modo={modo()}
        />


      </div>
    </div>
  );
}
