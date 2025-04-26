import { createEffect } from 'solid-js';

export default function FiltrosOperarios(props: {
  busqueda: string;
  onBuscar: (text: string) => void;
  onNuevo: () => void;
}) {
  createEffect(() => {
    props.onBuscar(props.busqueda); // Cada vez que cambia `busqueda`, disparamos onBuscar
  });

  return (
    <div class="flex flex-col md:flex-row md:items-center gap-2 mb-4">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        class="border p-2 rounded w-full md:w-1/3"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />
      <button
        onClick={props.onNuevo}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        + Nuevo Operario
      </button>
    </div>
  );
}
