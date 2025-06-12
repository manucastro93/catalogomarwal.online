import { For, Show, createSignal, createEffect, createMemo } from "solid-js";
import type { Usuario } from "@/types/usuario";
import type { EstadoPedido } from "types/estadoPedido";
import type { VendedorOption } from "@/types/vendedor";

const ESTADOS_DUX = [
  { id: 1, nombre: "PENDIENTE" },
  { id: 2, nombre: "FACTURADO_PARCIAL" },
  { id: 3, nombre: "FACTURADO" },
  { id: 4, nombre: "CERRADO" },
];

export default function FiltrosPedidos(props: {
  busqueda: string;
  vendedorId: number | undefined;
  estado?: number[];
  esVendedor: boolean;
  vendedores: Usuario[];
  vendedoresDux: VendedorOption[];
  estados: EstadoPedido[];
  desde: string;
  hasta: string;
  mostrarPedidosDux?: boolean;
  onTogglePedidosDux?: (valor: boolean) => void;
  onBuscar: (text: string) => void;
  onVendedorSeleccionado: (id: number | undefined) => void;
  onEstadoSeleccionado: (estado: number[] | undefined) => void;
  onFechaDesdeSeleccionada: (fecha: string) => void;
  onFechaHastaSeleccionada: (fecha: string) => void;
}) {
  const [estadoFiltrado, setEstadoFiltrado] = createSignal<number[] | undefined>(props.estado);

const idsDuxPorDefecto = [1, 2];

createEffect(() => {
  if (props.mostrarPedidosDux && !estadoFiltrado()) {
    setEstadoFiltrado(idsDuxPorDefecto);
    props.onEstadoSeleccionado(idsDuxPorDefecto);
  }
});

  const estadosDisponibles = createMemo(() => {
    return props.mostrarPedidosDux ? ESTADOS_DUX : props.estados;
  });

  const vendedoresDisponibles = createMemo(() =>
    props.mostrarPedidosDux ? props.vendedoresDux : props.vendedores
  );

  return (
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Buscar por cliente"
        class="p-2 border rounded w-full max-w-md"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />

      <input
        type="date"
        class="p-2 border rounded"
        value={props.desde}
        onChange={(e) => props.onFechaDesdeSeleccionada(e.currentTarget.value)}
      />
      <input
        type="date"
        class="p-2 border rounded"
        value={props.hasta}
        onChange={(e) => props.onFechaHastaSeleccionada(e.currentTarget.value)}
      />

      <Show when={!props.esVendedor}>
        <select
          class="p-2 border rounded"
          value={props.vendedorId?.toString() ?? ""}
          onChange={(e) =>
            props.onVendedorSeleccionado(
              e.currentTarget.value ? Number(e.currentTarget.value) : undefined
            )
          }
        >
          <option value="">Todos los vendedores</option>
          <For each={vendedoresDisponibles()}>
            {(v) => (
              <option value={v.id}>
                {v.nombre}
                {"apellido_razon_social" in v ? ` ${v.apellido_razon_social}` : ""}
              </option>
            )}
          </For>
        </select>
      </Show>

      <select
        class="border p-2 rounded"
        value={estadoFiltrado()?.length === 1 ? estadoFiltrado()?.[0].toString() : ""}
        onChange={(e) => {
          const val = Number(e.currentTarget.value);
          const nuevaSeleccion = val ? [val] : [1, 2]; // default múltiple si vacío
          setEstadoFiltrado(nuevaSeleccion);
          props.onEstadoSeleccionado(nuevaSeleccion);
        }}
      >
        <option value="">Pendiente o Facturado Parcial</option>
        <For each={estadosDisponibles()}>
          {(estado) => <option value={estado.id}>{estado.nombre}</option>}
        </For>
      </select>

      <input
        type="checkbox"
        checked={props.mostrarPedidosDux || false}
        onChange={(e) => props.onTogglePedidosDux?.(e.currentTarget.checked)}
        class="ml-2"
      />
      <label>Pedidos de Dux</label>
    </div>
  );
}
