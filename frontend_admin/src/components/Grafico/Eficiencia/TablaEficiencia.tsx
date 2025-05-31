import { Show, createSignal, createMemo, For } from "solid-js";
import { formatearFechaHora, formatearMiles } from "@/utils/formato";
import type {
  EficienciaPedido,
  EficienciaCategoria,
  EficienciaProducto,
  EficienciaCliente,
} from "@/types/eficiencia";

type Item = EficienciaPedido | EficienciaCategoria | EficienciaProducto | EficienciaCliente;

interface Props {
  datos: Item[];
  modo: "pedido" | "categoria" | "producto" | "cliente";
  loading?: boolean;
  onSeleccionar?: (item: Item) => void;
}

export default function TablaEficiencia({ datos, modo, loading = false, onSeleccionar }: Props) {
  const [paginaActual, setPaginaActual] = createSignal(1);
  const elementosPorPagina = 10;

  const totalPaginas = createMemo(() =>
    Math.ceil(datos.length / elementosPorPagina)
  );

  const datosPaginados = createMemo(() => {
    const inicio = (paginaActual() - 1) * elementosPorPagina;
    return datos.slice(inicio, inicio + elementosPorPagina);
  });

  const getLabel = (item: Item) => {
    switch (modo) {
      case "categoria":
        return "categoriaNombre" in item ? item.categoriaNombre : "—";
      case "producto":
        return "producto" in item ? item.producto : "—";
      case "cliente":
        return "cliente" in item ? item.cliente : "—";
      case "pedido":
        return "nroPedido" in item ? item.nroPedido : "—";
      default:
        return "—";
    }
  };

  const getFecha = (item: Item) => {
    if ("fecha" in item) return formatearFechaHora(item.fecha);
    return "—";
  };

  const getLeadTime = (item: Item) => {
    const valor = item.leadTimeDias ?? item.leadTimePromedio;
    return typeof valor === "number" ? valor.toFixed(2) : "—";
  };

  const getFillRate = (item: Item) =>
    item.fillRate !== null && item.fillRate !== undefined
      ? `${item.fillRate.toFixed(2)}%`
      : "—";

  const getCantidad = (valor: number | null | undefined) =>
    valor !== null && valor !== undefined ? formatearMiles(valor) : "—";

  if (loading) {
    return (
      <div class="p-6 text-center text-gray-500 text-sm">
        Cargando datos de tabla...
      </div>
    );
  }

  return (
    <div class="overflow-x-auto w-full">
      <table class="min-w-full bg-white shadow-md rounded-md">
        <thead class="bg-gray-100 text-xs md:text-sm text-gray-600 text-left">
          <tr>
            <th class="px-4 py-2 capitalize">
  {(() => {
    switch (modo) {
      case "pedido":
        return "Pedido";
      case "categoria":
        return "Categoría";
      case "producto":
        return "Producto";
      case "cliente":
        return "Cliente";
      default:
        return "";
    }
  })()}
</th>

            {modo === "pedido" && <th class="px-4 py-2">Fecha</th>}
            <th class="px-4 py-2">Cant. Pedida</th>
            <th class="px-4 py-2">Cant. Facturada</th>
            <th class="px-4 py-2">Fill Rate</th>
            <th class="px-4 py-2">Lead Time (días)</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <Show
            when={datosPaginados().length > 0}
            fallback={
              <tr>
                <td colspan="6" class="text-center py-4 text-gray-500">
                  No hay resultados
                </td>
              </tr>
            }
          >
            <For each={datosPaginados()}>
              {(item) => (
                <tr
                  class="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSeleccionar?.(item)}
                >
                  <td class="px-4 py-2 font-semibold text-blue-600 hover:underline">
                    {String(getLabel(item))}
                  </td>
                  {modo === "pedido" && (
                    <td class="px-4 py-2">{getFecha(item)}</td>
                  )}
                  <td class="px-4 py-2">
                    {getCantidad(item.cantidadPedida)}
                  </td>
                  <td class="px-4 py-2">
                    {getCantidad(item.cantidadFacturada)}
                  </td>
                  <td class="px-4 py-2">{getFillRate(item)}</td>
                  <td class="px-4 py-2">{getLeadTime(item)}</td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>

      <Show when={totalPaginas() > 1}>
        <div class="flex justify-center items-center gap-4 mt-4 text-sm">
          <button
            class="px-2 py-1 rounded border"
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
          >
            ◀ Anterior
          </button>
          <span>
            Página {paginaActual()} de {totalPaginas()}
          </span>
          <button
            class="px-2 py-1 rounded border"
            onClick={() =>
              setPaginaActual((p) => Math.min(p + 1, totalPaginas()))
            }
          >
            Siguiente ▶
          </button>
        </div>
      </Show>
    </div>
  );
}
