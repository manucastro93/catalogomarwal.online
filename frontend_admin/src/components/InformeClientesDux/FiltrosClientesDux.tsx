import { For, Show } from "solid-js";
import { PersonalDux } from "@/types/usuario";
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { useAuth } from '@/store/auth';

interface Props {
  fechaDesde: string | null;
  fechaHasta: string | null;
  vendedor: string;
  listaPrecio: string;
  vendedores: PersonalDux[];
  listasPrecio: string[];
  onFechaDesde: (v: string | null) => void;
  onFechaHasta: (v: string | null) => void;
  onVendedor: (v: string) => void;
  onListaPrecio: (v: string) => void;
  onAplicar: () => void;
}

export default function FiltrosClientesDux(props: Props) {
    const { usuario } = useAuth();
  
  return (
    <div class="flex gap-4 flex-wrap items-end mb-6">
      {/* Fecha desde */}
      <div>
        <label class="block text-sm font-medium">Fecha desde</label>
        <input
          type="date"
          class="border px-2 py-1 rounded"
          value={props.fechaDesde ?? ""}
          onInput={(e) => props.onFechaDesde(e.currentTarget.value || null)}
        />
      </div>

      {/* Fecha hasta */}
      <div>
        <label class="block text-sm font-medium">Fecha hasta</label>
        <input
          type="date"
          class="border px-2 py-1 rounded"
          value={props.fechaHasta ?? ""}
          onInput={(e) => props.onFechaHasta(e.currentTarget.value || null)}
        />
      </div>

      {/* Lista de precio */}
      <div>
        <label class="block text-sm font-medium">Lista de precio</label>
        <select
          class="border px-2 py-1 rounded min-w-[150px]"
          value={props.listaPrecio}
          onInput={(e) => props.onListaPrecio(e.currentTarget.value)}
        >
          <option value="">Todas</option>
          <For each={props.listasPrecio}>
            {(lp) => <option value={lp}>{lp}</option>}
          </For>
        </select>
      </div>

      {/* Vendedor */}
      <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR}>
        <div>
          <label class="block text-sm font-medium">Vendedor</label>
          <select
            class="border px-2 py-1 rounded min-w-[150px]"
            value={props.vendedor}
            onInput={(e) => props.onVendedor(e.currentTarget.value)}
          >
            <option value="">Todos</option>
            <For each={props.vendedores}>
              {(v) => {
                const valor = `${v.apellido_razon_social?.toUpperCase() || ""}, ${v.nombre?.toUpperCase() || ""}`;
                return <option value={valor}>{valor}</option>;
              }}
            </For>
          </select>
        </div>
      </Show>
    </div>
  );
}
