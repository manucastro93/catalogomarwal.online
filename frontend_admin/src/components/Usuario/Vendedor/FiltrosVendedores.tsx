export default function FiltrosVendedores(props: {
  busqueda: string;
  onBuscar: (valor: string) => void;
  onNuevo: () => void;
}) {
  return (
    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-4">
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        class="p-2 border rounded w-full sm:w-auto"
        value={props.busqueda}
        onInput={(e) => props.onBuscar(e.currentTarget.value)}
      />
      <button
        onClick={props.onNuevo}
        class="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
      >
        + Nuevo Vendedor
      </button>
    </div>
  );
}
