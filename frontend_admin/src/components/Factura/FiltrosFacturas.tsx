import { For, Show } from "solid-js";
import type { PersonalDux } from "@/types/usuario";
import type { EstadoFactura } from "@/types/factura";

export default function FiltrosFacturas(props: {
  busqueda: string;
  vendedorId: number | undefined;
  estadoId?: number;
  esVendedor: boolean;
  vendedores: PersonalDux[];
  estados: EstadoFactura[];
  fechaDesde: string;
  fechaHasta: string;
  onBuscar: (text: string) => void;
  onVendedorSeleccionado: (id: number | undefined) => void;
  onEstadoSeleccionado: (estado: number | undefined) => void;
  onFechaDesde: (fecha: string) => void;
  onFechaHasta: (fecha: string) => void;
}) {
  return (
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Buscar por cliente o CUIT"
        class="p-2 border rounded w-full max-w-md"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
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
          <For each={props.vendedores}>
            {(v) => <option value={v.id_personal}>{v.nombre} {v.apellido_razon_social}</option>}
          </For>
        </select>
      </Show>

      <select
        class="border p-2 rounded"
        value={props.estadoId || ""}
        onChange={(e) =>
          props.onEstadoSeleccionado(
            e.currentTarget.value ? Number(e.currentTarget.value) : undefined
          )
        }
      >
        <option value="">Todos los estados</option>
        <For each={props.estados}>
          {(estado) => <option value={estado.id}>{estado.nombre}</option>}
        </For>
      </select>

      <input
        type="date"
        class="p-2 border rounded"
        value={props.fechaDesde}
        onInput={(e) => props.onFechaDesde(e.currentTarget.value)}
      />
      <input
        type="date"
        class="p-2 border rounded"
        value={props.fechaHasta}
        onInput={(e) => props.onFechaHasta(e.currentTarget.value)}
      />
    </div>
  );
}
