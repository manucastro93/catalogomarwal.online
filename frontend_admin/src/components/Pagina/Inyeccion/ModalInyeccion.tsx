import { createSignal, Show, createEffect } from "solid-js";

interface ModalInyeccionProps {
  abierto: boolean;
  tipo: "maquina" | "categoria" | "material";
  item?: any;
  onCerrar: () => void;
  onGuardar: (data: any) => void;
  rubroId: number; // <-- SE PASA POR PROP
}

const TITULOS: Record<string, string> = {
  maquina: "Máquina",
  categoria: "Categoría",
  material: "Material",
};

export default function ModalInyeccion(props: ModalInyeccionProps) {
  const [codigo, setCodigo] = createSignal("");
  const [nombre, setNombre] = createSignal("");
  const [descripcion, setDescripcion] = createSignal("");
  const [toneladas, setToneladas] = createSignal("");
  const [error, setError] = createSignal("");

  createEffect(() => {
    if (props.abierto) {
      setCodigo(props.item?.codigo || "");
      setNombre(props.item?.nombre || "");
      setDescripcion(props.item?.descripcion || "");
      setToneladas(props.item?.toneladas?.toString() || "");
      setError("");
    }
  });

  const handleGuardar = () => {
    if (props.tipo === "maquina") {
      if (!codigo().trim() || !nombre().trim()) {
        setError("Código y nombre son obligatorios.");
        return;
      }
      setError("");
      props.onGuardar({
        codigo: codigo().trim(),
        nombre: nombre().trim(),
        descripcion: descripcion().trim(),
        toneladas: toneladas() ? parseFloat(toneladas()) : null,
        rubroId: props.rubroId, // SIEMPRE EL RUBRO DEL PADRE
      });
    } else if (props.tipo === "categoria") {
      if (!nombre().trim()) {
        setError("El nombre es obligatorio.");
        return;
      }
      setError("");
      props.onGuardar({
        nombre: nombre().trim(),
        descripcion: descripcion().trim(),
        rubroId: props.rubroId,
      });
    } else if (props.tipo === "material") {
      if (!codigo().trim()) {
        setError("El código es obligatorio.");
        return;
      }
      setError("");
      props.onGuardar({
        codigo: codigo().trim(),
        descripcion: descripcion().trim(),
        rubroId: props.rubroId,
      });
    }
  };

  if (!props.abierto) return null;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 md:p-6 border border-gray-300 flex flex-col overflow-y-auto relative">
        <button
          class="absolute top-2 right-2 text-gray-400 hover:text-red-600"
          onClick={props.onCerrar}
        >
          ✕
        </button>
        <h2 class="text-2xl font-bold mb-6">
          {props.item?.id ? `Editar ${TITULOS[props.tipo]}` : `Agregar ${TITULOS[props.tipo]}`}
        </h2>
        <form onSubmit={e => { e.preventDefault(); handleGuardar(); }}>
          <Show when={props.tipo === "maquina"}>
            <div class="mb-4">
              <label class="block font-medium mb-1">Código *</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={codigo()} onInput={e => setCodigo(e.currentTarget.value)} />
            </div>
            <div class="mb-4">
              <label class="block font-medium mb-1">Nombre *</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={nombre()} onInput={e => setNombre(e.currentTarget.value)} />
            </div>
            <div class="mb-4">
              <label class="block font-medium mb-1">Descripción</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={descripcion()} onInput={e => setDescripcion(e.currentTarget.value)} />
            </div>
            <div class="mb-4">
              <label class="block font-medium mb-1">Toneladas</label>
              <input type="number" class="w-full border rounded-lg px-3 py-2"
                value={toneladas()} onInput={e => setToneladas(e.currentTarget.value)} />
            </div>
          </Show>
          <Show when={props.tipo === "categoria"}>
            <div class="mb-4">
              <label class="block font-medium mb-1">Nombre *</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={nombre()} onInput={e => setNombre(e.currentTarget.value)} />
            </div>
            <div class="mb-4">
              <label class="block font-medium mb-1">Descripción</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={descripcion()} onInput={e => setDescripcion(e.currentTarget.value)} />
            </div>
          </Show>
          <Show when={props.tipo === "material"}>
            <div class="mb-4">
              <label class="block font-medium mb-1">Código *</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={codigo()} onInput={e => setCodigo(e.currentTarget.value)} />
            </div>
            <div class="mb-4">
              <label class="block font-medium mb-1">Descripción</label>
              <input type="text" class="w-full border rounded-lg px-3 py-2"
                value={descripcion()} onInput={e => setDescripcion(e.currentTarget.value)} />
            </div>
          </Show>
          <Show when={error()}>
            <div class="mb-3 text-red-600 text-sm">{error()}</div>
          </Show>
          <div class="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              class="px-4 py-2 border rounded text-sm"
              onClick={props.onCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="bg-green-600 text-white px-4 py-2 rounded text-sm"
            >
              {props.item?.id ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
