import { createSignal, Show, onMount } from "solid-js";
import type { RolUsuario } from "@/types/rolUsuario";
import { crearRolUsuario, editarRolUsuario } from "@/services/rolUsuario.service";

interface Props {
  rol?: RolUsuario;
  onGuardar: () => void;
  onCerrar: () => void;
}

export default function ModalRolUsuario({ rol, onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = createSignal("");
  const [descripcion, setDescripcion] = createSignal("");

  onMount(() => {
    if (rol) {
      setNombre(rol.nombre);
      setDescripcion(rol.descripcion || "");
    }
  });

  const handleGuardar = async () => {
    if (!nombre().trim()) return;

    const payload = {
      nombre: nombre().trim(),
      descripcion: descripcion().trim() || undefined,
    };

    if (rol) {
      await editarRolUsuario(rol.id, payload);
    } else {
      await crearRolUsuario(payload);
    }

    onGuardar();
    onCerrar();
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {rol ? "Editar rol" : "Nuevo rol"}
        </h2>

        <label class="block mb-2">
          <span class="text-sm">Nombre</span>
          <input type="text" class="input" value={nombre()} onInput={(e) => setNombre(e.currentTarget.value)} />
        </label>

        <label class="block mb-4">
          <span class="text-sm">Descripción</span>
          <textarea class="input" value={descripcion()} onInput={(e) => setDescripcion(e.currentTarget.value)} />
        </label>

        <div class="flex justify-end gap-2">
          <button class="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button class="btn-primary" onClick={handleGuardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
