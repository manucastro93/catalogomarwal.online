import { For } from 'solid-js';
import type { Provincia, Localidad } from '@/types/ubicacion';

export default function FiltrosProveedores(props: {
  usuarioRol: number;
  busqueda: string;
  onBuscar: (valor: string) => void;
  provincias: Provincia[];
  localidades: Localidad[];
  provinciaSeleccionada: number | '';
  localidadSeleccionada: number | '';
  onSeleccionProvincia: (id: number | '') => void;
  onSeleccionLocalidad: (id: number | '') => void;
}) {
  return (
    <div class="flex gap-4 mb-4 flex-wrap">
      <input
        type="text"
        placeholder="Buscar por nombre, email, CUIT..."
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
