export default function FiltrosVendedores(props: {
    busqueda: string;
    onBuscar: (valor: string) => void;
    onNuevo: () => void;
  }) {
    return (
      <div class="flex gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Buscar..."
          class="p-2 border rounded"
          value={props.busqueda}
          onInput={(e) => props.onBuscar(e.currentTarget.value)}
        />
        <button
          onClick={props.onNuevo}
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          + Nuevo Vendedor
        </button>
      </div>
    );
  }
  