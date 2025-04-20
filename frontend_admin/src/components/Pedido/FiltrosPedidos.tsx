import { For, Show } from "solid-js";
import type { Usuario } from "../../types/usuario";

export default function FiltrosPedidos(props: {
  busqueda: string;
  vendedorId: string;
  estado: string;
  esVendedor: boolean;
  vendedores: Usuario[];
  onBuscar: (text: string) => void;
  onVendedorSeleccionado: (id: string) => void;
  onEstadoSeleccionado: (estado: string) => void;
}) {
  return (
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Buscar por cliente"
        class="p-2 border rounded w-full max-w-md"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />

      <Show when={!props.esVendedor}>
        <select
          class="p-2 border rounded"
          value={props.vendedorId}
          onInput={(e) => props.onVendedorSeleccionado(e.currentTarget.value)}
        >
          <option value="">Todos los vendedores</option>
          <For each={props.vendedores}>
            {(v) => <option value={v.id}>{v.nombre}</option>}
          </For>
        </select>
      </Show>

      <select
        class="p-2 border rounded"
        value={props.estado}
        onInput={(e) => props.onEstadoSeleccionado(e.currentTarget.value)}
      >
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmado">Confirmado</option>
        <option value="preparando">En preparación</option>
        <option value="enviado">Enviado</option>
        <option value="entregado">Entregado</option>
        <option value="cancelado">Cancelado</option>
        <option value="rechazado">Rechazado</option>
      </select>
    </div>
  );
}
