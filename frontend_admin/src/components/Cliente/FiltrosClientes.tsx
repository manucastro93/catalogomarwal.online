import { For, Show } from 'solid-js';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { Provincia, Localidad } from '@/types/ubicacion';
import type { Usuario } from '@/types/usuario';


export default function FiltrosClientes(props: {
  usuarioRol: number;
  busqueda: string;
  onBuscar: (valor: string) => void;
  provincias: Provincia[];
  localidades: Localidad[];
  vendedores: Usuario[];
  provinciaSeleccionada: number | '';
  localidadSeleccionada: number | '';
  vendedorSeleccionado: number | '';
  onSeleccionProvincia: (id: number | '') => void;
  onSeleccionLocalidad: (id: number | '') => void;
  onSeleccionVendedor: (id: number | '') => void;
}) {
  return (
    <div class="flex gap-4 mb-4 flex-wrap">
      <Show when={props.usuarioRol !== ROLES_USUARIOS.VENDEDOR}>
        <select
          class="p-2 border rounded"
          value={props.vendedorSeleccionado}
          onInput={(e) => props.onSeleccionVendedor(Number(e.currentTarget.value) || '')}
        >
          <option value="">Todos los vendedores</option>
          <For each={props.vendedores}>
            {(v) => <option value={v.id}>{v.nombre}</option>}
          </For>
        </select>
      </Show>

      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        class="p-2 border rounded w-full max-w-xs"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />

      <select
        class="p-2 border rounded"
        value={props.provinciaSeleccionada}
        onInput={(e) => props.onSeleccionProvincia(Number(e.currentTarget.value) || '')}
      >
        <option value="">Todas las provincias</option>
        <For each={props.provincias}>
          {(p) => <option value={p.id}>{p.nombre}</option>}
        </For>
      </select>

      <select
        class="p-2 border rounded"
        value={props.localidadSeleccionada}
        onInput={(e) => props.onSeleccionLocalidad(Number(e.currentTarget.value) || '')}
      >
        <option value="">Todas las localidades</option>
        <For each={props.localidades}>
          {(l) => <option value={l.id}>{l.nombre}</option>}
        </For>
      </select>
    </div>
  );
}
