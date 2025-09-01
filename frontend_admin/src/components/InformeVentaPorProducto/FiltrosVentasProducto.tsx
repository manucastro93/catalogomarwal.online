// src/components/Estadisticas/FiltrosVentasProducto.tsx
import { For } from "solid-js";

type Props = {
  q: string;
  onQ: (v: string) => void;
  categoriaId?: number;
  onCategoria: (id?: number) => void;
  vendedor?: string;
  onVendedor: (v?: string) => void;
  categorias: { id: number; nombre: string }[];
  vendedores: { id_personal: number; apellido_razon_social?: string; nombre?: string }[];
};

export default function FiltrosVentasProducto(props: Props) {
  return (
    <div class="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input
        value={props.q}
        onInput={(e) => props.onQ(e.currentTarget.value)}
        placeholder="Buscar por código o descripción…"
        class="w-full border rounded px-3 py-2"
      />
      <select
        class="w-full border rounded px-3 py-2"
        value={props.categoriaId ?? ""}
        onChange={(e) => props.onCategoria(e.currentTarget.value ? Number(e.currentTarget.value) : undefined)}
      >
        <option value="">Todas las categorías</option>
        <For each={props.categorias}>
          {(c) => <option value={c.id}>{c.nombre}</option>}
        </For>
      </select>
      <select
        class="w-full border rounded px-3 py-2"
        value={props.vendedor ?? ""}
        onChange={(e) => props.onVendedor(e.currentTarget.value || undefined)}
      >
        <option value="">Todos los vendedores</option>
        <For each={props.vendedores}>
          {(v) => (
            <option value={`${v.apellido_razon_social || ""}, ${v.nombre || ""}`.trim()}>
              {(v.apellido_razon_social || "") + (v.nombre ? `, ${v.nombre}` : "")}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}
