import { Show } from 'solid-js';

interface Props {
  busqueda: string;
  derivar: string;
  onBuscar: (valor: string) => void;
  onSeleccionDerivar: (valor: string) => void;
}

export default function FiltrosConversacionesBot(props: Props) {
  return (
    <div class="mb-4 flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-sm font-medium mb-1">Buscar</label>
        <input
          type="text"
          value={props.busqueda}
          onInput={(e) => props.onBuscar(e.currentTarget.value)}
          class="border rounded px-2 py-1 text-sm w-64"
          placeholder="Teléfono, mensaje o respuesta"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Derivar</label>
        <select
          value={props.derivar}
          onChange={(e) => props.onSeleccionDerivar(e.currentTarget.value)}
          class="border rounded px-2 py-1 text-sm"
        >
          <option value="">Todos</option>
          <option value="true">Solo derivados</option>
          <option value="false">No derivados</option>
        </select>
      </div>
    </div>
  );
}
