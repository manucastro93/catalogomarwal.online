import { For, Show } from "solid-js";
import type { Usuario } from "@/types/usuario";
import type { EstadoPedido } from "types/estadoPedido";
import { ESTADOS_PEDIDO } from "@/constants/estadosPedidos";
import { Download } from 'lucide-solid';
import { exportarTablaAExcel } from '@/utils/exportarTabla';

export default function FiltrosPedidos(props: {
  busqueda: string;
  vendedorId: number | undefined;
  estado?: number;
  esVendedor: boolean;
  vendedores: Usuario[];
  estados: EstadoPedido[];
  onBuscar: (text: string) => void;
  onVendedorSeleccionado: (id: number | undefined) => void;
  onEstadoSeleccionado: (estado: number | undefined) => void;
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
          value={props.vendedorId?.toString() ?? ""}
          onChange={(e) =>
            props.onVendedorSeleccionado(
              e.currentTarget.value ? Number(e.currentTarget.value) : undefined
            )
          }
        >
          <option value="">Todos los vendedores</option>
          <For each={props.vendedores}>
            {(v) => <option value={v.id}>{v.nombre}</option>}
          </For>
        </select>
      </Show>

      <select
        class="border p-2 rounded"
        value={props.estado || ""}
        onChange={(e) => props.onEstadoSeleccionado(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)}
      >
        <option value="">Todos los estados</option>
        <For each={props.estados}>
          {(estado) => (
            <option value={estado.id}>
              {estado.nombre}
            </option>
          )}
        </For>
      </select>
      <button
                onClick={() => exportarTablaAExcel('tabla-produccion', 'Reporte Produccion')}
                class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                <Download size={18} />
                Exportar Reporte
              </button>
    </div>
  );
}
