import { createSignal, createResource, createMemo, Show, onMount } from "solid-js";
import dayjs from "dayjs";
import { obtenerProductosPedidosPendientes } from "@/services/pedido.service";
import { obtenerPersonalDux } from "@/services/personalDux.service";
import VerPedidosPendientesProductoModal from "@/components/ProductosPedidosPendientes/VerPedidosPendientesProductoModal";
import FiltrosProductosPendientes from "@/components/ProductosPedidosPendientes/FiltrosProductosPendientes";
import TablaProductosPendientes from "@/components/ProductosPedidosPendientes/TablaProductosPendientes";
import { exportarDatosAExcel } from "@/utils/exportarDatosAExcel";
import Loader from "@/components/Layout/Loader";
import type { ProductoPendiente } from "@/types/producto";
import { formatearFechaCorta } from "@/utils/formato";

export default function ProductosPedidosPendientes() {
  const hoy = dayjs().format("YYYY-MM-DD");
  const haceUnMes = dayjs().subtract(1, "month").format("YYYY-MM-DD");

  const [textoProducto, setTextoProducto] = createSignal("");
  const [vendedorId, setVendedorId] = createSignal<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = createSignal(haceUnMes);
  const [fechaHasta, setFechaHasta] = createSignal(hoy);
  const [orden, setOrden] = createSignal<keyof ProductoPendiente>("cantidad_pendiente");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [pagina, setPagina] = createSignal(1);
  const elementosPorPagina = 20;

  const [productoSeleccionado, setProductoSeleccionado] = createSignal<string | null>(null);
  const [vendedores] = createResource(obtenerPersonalDux);

  const camposNumericos: (keyof ProductoPendiente)[] = [
    "codItem",
    "cantidad_pedida",
    "cantidad_facturada",
    "cantidad_pendiente",
    "fabricar"
  ];

  const fetchParams = createMemo(() => ({
    desde: fechaDesde(),
    hasta: fechaHasta(),
    textoProducto: textoProducto(),
    vendedorId: vendedorId(),
  }));

  const [productos, { mutate }] = createResource(fetchParams, async (params) => {
    const res = await obtenerProductosPedidosPendientes(params);
    return res.sort((a, b) =>
      camposNumericos.includes(orden())
        ? Number(b[orden()]) - Number(a[orden()])
        : String(b[orden()]).localeCompare(String(a[orden()]))
    );
  });

  const cambiarOrden = (col: keyof ProductoPendiente) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }

    const lista = productos()?.slice() ?? [];
    const mult = direccion() === "asc" ? 1 : -1;

    mutate?.(
      lista.sort((a, b) => {
        if (camposNumericos.includes(col)) {
          return (Number(a[col]) - Number(b[col])) * mult;
        }
        return String(a[col]).localeCompare(String(b[col])) * mult;
      })
    );
  };

  const productosPaginados = () => {
    const todos = productos() ?? [];
    const inicio = (pagina() - 1) * elementosPorPagina;
    return todos.slice(inicio, inicio + elementosPorPagina);
  };

  const totalPaginas = () => Math.ceil((productos()?.length ?? 0) / elementosPorPagina);

  async function exportarProductosPendientesFiltrados() {
    const filtros = fetchParams();
    const data = await obtenerProductosPedidosPendientes(filtros);

    const desdeTexto = formatearFechaCorta(fechaDesde());
    const hastaTexto = formatearFechaCorta(fechaHasta());
    const rangoFechas = `${desdeTexto} a ${hastaTexto}`;
    const nombreArchivo = "Productos Pedidos Pendientes";

    const columnas = [
      { label: "Código", key: "codItem" },
      { label: "Categoría", key: "categoria" },
      { label: "Descripción", key: "descripcion" },
      { label: "Cantidad Pedida", key: "cantidad_pedida" },
      { label: "Cantidad Facturada", key: "cantidad_facturada" },
      { label: "Cantidad Pendiente", key: "cantidad_pendiente" },
    ];

    const datosFormateados = data.map((item: any) => ({ ...item }));

    exportarDatosAExcel(datosFormateados, columnas, nombreArchivo, rangoFechas);
  }

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Productos Pedidos Pendientes</h1>
      <button
        onClick={exportarProductosPendientesFiltrados}
        class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
      >
        Exportar Excel
      </button>
      <FiltrosProductosPendientes
        textoProducto={textoProducto()}
        vendedorId={vendedorId()}
        desde={fechaDesde()}
        hasta={fechaHasta()}
        vendedores={vendedores() ?? []}
        onBuscarTexto={(txt) => {
          setTextoProducto(txt);
          setPagina(1);
        }}
        onVendedorSeleccionado={(id) => {
          setVendedorId(id);
          setPagina(1);
        }}
        onFechaDesdeSeleccionada={(d) => {
          setFechaDesde(d);
          setPagina(1);
        }}
        onFechaHastaSeleccionada={(d) => {
          setFechaHasta(d);
          setPagina(1);
        }}
      />

      <Show when={!productos.loading} fallback={<Loader />}>
        <TablaProductosPendientes
          productos={productosPaginados()}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          onVerProducto={setProductoSeleccionado}
        />

        <div class="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            class="px-3 py-1 border rounded disabled:opacity-50"
            disabled={pagina() === 1}
          >
            ◀
          </button>
          <span class="text-sm">
            Página {pagina()} de {totalPaginas()}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas(), p + 1))}
            class="px-3 py-1 border rounded disabled:opacity-50"
            disabled={pagina() >= totalPaginas()}
          >
            ▶
          </button>
        </div>
      </Show>

      <Show when={productoSeleccionado()}>
        <VerPedidosPendientesProductoModal
          codItem={productoSeleccionado()!}
          abierto={!!productoSeleccionado()}
          desde={fechaDesde()}
          hasta={fechaHasta()}
          onCerrar={() => setProductoSeleccionado(null)}
        />
      </Show>
    </div>
  );
}
