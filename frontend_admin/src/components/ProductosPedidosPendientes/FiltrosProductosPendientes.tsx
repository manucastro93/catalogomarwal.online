import { For, Show } from "solid-js";
import type { VendedorOption } from "@/types/vendedor";

interface Props {
  textoProducto: string;
  vendedorId: number | undefined;
  desde: string;
  hasta: string;
  vendedores: VendedorOption[];

  onBuscarTexto: (texto: string) => void;
  onVendedorSeleccionado: (id: number | undefined) => void;
  onFechaDesdeSeleccionada: (fecha: string) => void;
  onFechaHastaSeleccionada: (fecha: string) => void;
}

export default function FiltrosProductosPendientes(props: Props) {
  return (
    <div class="flex flex-wrap items-end gap-3 mb-4">
      <input
        type="text"
        placeholder="Buscar producto por código, nombre o descripción"
        class="p-2 border rounded w-full max-w-md"
        value={props.textoProducto}
        onInput={(e) => props.onBuscarTexto(e.currentTarget.value)}
      />

      <select
        class="p-2 border rounded"
        value={props.vendedorId ?? ""}
        onChange={(e) =>
          props.onVendedorSeleccionado(
            e.currentTarget.value ? Number(e.currentTarget.value) : undefined
          )
        }
      >
        <option value="">Todos los vendedores</option>
        <For each={props.vendedores}>
          {(v) => (
            <option value={v.id}>
              {v.nombre}
              {v.apellido_razon_social ? ` ${v.apellido_razon_social}` : ""}
            </option>
          )}
        </For>
      </select>

      <div>
        <label class="block text-xs text-gray-600">Desde</label>
        <input
          type="date"
          class="p-2 border rounded"
          value={props.desde}
          onChange={(e) => props.onFechaDesdeSeleccionada(e.currentTarget.value)}
        />
      </div>

      <div>
        <label class="block text-xs text-gray-600">Hasta</label>
        <input
          type="date"
          class="p-2 border rounded"
          value={props.hasta}
          onChange={(e) => props.onFechaHastaSeleccionada(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
