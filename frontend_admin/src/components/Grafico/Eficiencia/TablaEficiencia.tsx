import { Show, createSignal, createMemo, For } from "solid-js";
import { formatearFechaCorta, formatearMiles } from "@/utils/formato";
import type {
  EficienciaCategoria,
  EficienciaProducto,
  EficienciaCliente,
} from "@/types/eficiencia";

type Item =
  | EficienciaCategoria
  | EficienciaProducto
  | EficienciaCliente;

interface Props {
  datos: Item[];
  modo: "categoria" | "producto" | "cliente";
  loading?: boolean;
  onSeleccionar?: (item: Item) => void;
}

export default function TablaEficiencia({
  datos,
  modo,
  loading = false,
  onSeleccionar,
}: Props) {
  const [paginaActual, setPaginaActual] = createSignal(1);
  const elementosPorPagina = 20;

  const [columnaOrden, setColumnaOrden] = createSignal<null | string>(null);
  const [direccionOrden, setDireccionOrden] = createSignal<"asc" | "desc">(
    "asc"
  );

  const ordenar = (col: string) => {
    if (columnaOrden() === col) {
      setDireccionOrden(direccionOrden() === "asc" ? "desc" : "asc");
    } else {
      setColumnaOrden(col);
      setDireccionOrden("asc");
    }
  };

  const getKeyForModo = (modo: string) => {
    switch (modo) {
      case "categoria":
        return "categoria";
      case "producto":
        return "producto";
      case "cliente":
        return "cliente";
      default:
        return "";
    }
  };

  const datosOrdenados = createMemo(() => {
    if (!columnaOrden()) return datos;
    return [...datos].sort((a, b) => {
      const col = columnaOrden()!;

      const valA =
        col === "leadTimeDias"
          ? (a as any).leadTimeDias ?? (a as any).leadTimePromedio
          : (a as any)[col];

      const valB =
        col === "leadTimeDias"
          ? (b as any).leadTimeDias ?? (b as any).leadTimePromedio
          : (b as any)[col];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return direccionOrden() === "asc" ? valA - valB : valB - valA;
      }

      return direccionOrden() === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  });

  const totalPaginas = createMemo(() =>
    Math.ceil(datosOrdenados().length / elementosPorPagina)
  );

  const datosPaginados = createMemo(() => {
    const inicio = (paginaActual() - 1) * elementosPorPagina;
    return datosOrdenados().slice(inicio, inicio + elementosPorPagina);
  });

  const getLabel = (item: Item) => {
    switch (modo) {
      case "categoria": {
        const cat = item as EficienciaCategoria;
        return cat.categoriaNombre || "—";
      }
      case "producto": {
        const prod = item as EficienciaProducto;
        return prod.codItem && prod.producto
          ? `${prod.codItem} - ${prod.producto}`
          : prod.producto || prod.codItem || "—";
      }
      case "cliente": {
        const cli = item as EficienciaCliente;
        return cli.cliente || "—";
      }
      default:
        return "—";
    }
  };

  const getLeadTime = (item: Item) => {
    const valor = item.leadTimeDias ?? item.leadTimePromedio;
    return typeof valor === "number" ? valor.toFixed(2) : "—";
  };

  const getFillRate = (item: Item) =>
    item.fillRate !== null && item.fillRate !== undefined
      ? `${item.fillRate.toFixed(2)}%`
      : "—";

  const getFillRatePonderado = (item: Item) =>
    item.fillRatePonderado !== null && item.fillRatePonderado !== undefined
      ? `${item.fillRatePonderado.toFixed(2)}%`
      : "—";
  

  const getCantidad = (valor: number | null | undefined) =>
    valor !== null && valor !== undefined ? formatearMiles(valor) : "—";

  const iconoOrden = (col: string) => {
    if (columnaOrden() !== col) return "";
    return direccionOrden() === "asc" ? " ▲" : " ▼";
  };

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
            <th
              class="px-4 py-2 capitalize cursor-pointer"
              onClick={() => ordenar(getKeyForModo(modo))}
            >
              {(() => {
                switch (modo) {
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
              {iconoOrden(getKeyForModo(modo))}
            </th>

            <th
              class="px-4 py-2 cursor-pointer"
              onClick={() => ordenar("cantidadPedida")}
            >
              Cant. Pedida{iconoOrden("cantidadPedida")}
            </th>
            <th
              class="px-4 py-2 cursor-pointer"
              onClick={() => ordenar("cantidadFacturada")}
            >
              Cant. Facturada{iconoOrden("cantidadFacturada")}
            </th>
            <th
              class="px-4 py-2 cursor-pointer"
              onClick={() => ordenar("fillRate")}
            >
              Fill Rate{iconoOrden("fillRate")}
            </th>
            <th
              class="px-4 py-2 cursor-pointer"
              onClick={() => ordenar("fillRatePonderado")}
            >
              FR Ponderado ($){iconoOrden("fillRatePonderado")}
            </th>
            <th
              class="px-4 py-2 cursor-pointer"
              onClick={() => ordenar("leadTimeDias")}
            >
              Lead Time (días){iconoOrden("leadTimeDias")}
            </th>
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
                  <td class="px-4 py-2">{getCantidad(item.cantidadPedida)}</td>
                  <td class="px-4 py-2">
                    {getCantidad(item.cantidadFacturada)}
                  </td>
                  <td class="px-4 py-2">{getFillRate(item)}</td>
                  <td class="px-4 py-2">{getFillRatePonderado(item)}</td>
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
