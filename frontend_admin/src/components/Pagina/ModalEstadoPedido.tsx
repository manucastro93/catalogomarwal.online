import { createSignal, Show, onMount } from "solid-js";
import type { EstadoPedido } from "@/types/estadoPedido";
import { crearEstadoPedido, editarEstadoPedido } from "@/services/estadoPedido.service";

interface Props {
  estado?: EstadoPedido;
  onGuardar: () => void;
  onCerrar: () => void;
}

export default function ModalEstadoPedido({ estado, onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = createSignal("");
  const [descripcion, setDescripcion] = createSignal("");

  onMount(() => {
    if (estado) {
      setNombre(estado.nombre);
      setDescripcion(estado.descripcion || "");
    }
  });

  const handleGuardar = async () => {
    if (!nombre().trim()) return;

    const payload = {
      nombre: nombre().trim(),
      descripcion: descripcion().trim() || undefined,
    };

    if (estado) {
      await editarEstadoPedido(estado.id, payload);
    } else {
      await crearEstadoPedido(payload);
    }

    onGuardar();
    onCerrar();
  };

  return (
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {estado ? "Editar estado" : "Nuevo estado"}
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
