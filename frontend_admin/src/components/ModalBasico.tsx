interface ModalBasicoProps {
  abierto: boolean;
  cerrar: () => void;
}

export default function ModalBasico(props: ModalBasicoProps) {
  return (
    <div
      style={{ display: props.abierto ? 'block' : 'none' }} // Si 'abierto' es true, mostramos el modal
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 class="text-2xl font-bold mb-4">Nuevo Vendedor</h2>
        <form>
          <div class="mb-4">
            <label class="block text-sm font-medium">Nombre:</label>
            <input type="text" class="w-full p-2 border rounded-md" />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium">Email:</label>
            <input type="email" class="w-full p-2 border rounded-md" />
          </div>
          <div class="flex justify-between mt-4">
            <button
              type="button"
              onClick={props.cerrar}
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
