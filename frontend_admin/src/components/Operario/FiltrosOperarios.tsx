import ConPermiso from '@/components/Layout/ConPermiso';

export default function FiltrosOperarios(props: {
  busqueda: string;
  onBuscar: (val: string) => void;
  onNuevo: () => void;
}) {
  return (
    <div class="flex items-center justify-between mb-4 gap-2 flex-wrap">
      <input
        type="text"
        class="border rounded-lg px-4 py-2 text-base w-full max-w-xs"
        placeholder="Buscar por nombre, apellido, código o rubro..."
        value={props.busqueda}
        onInput={e => props.onBuscar(e.currentTarget.value)}
      />
      <ConPermiso modulo="Operarios" accion="crear">
        <button
          class="bg-green-600 text-white px-3 py-1 rounded text-sm"
          onClick={props.onNuevo}
        >
          + Nuevo operario
        </button>
      </ConPermiso>
    </div>
  );
}

