import { createSignal, createResource, Show, For } from "solid-js";
import {
  obtenerPermisosPorRol,
  actualizarPermisosRol,
} from "@/services/rolUsuario.service";
import ModalMensaje from "@/components/Layout/ModalMensaje"; // 🔥
import type { RolUsuario } from "@/types/rolUsuario";
import type { PermisoUsuario } from "@/types/permisoUsuario";

interface Props {
  rol?: RolUsuario;
  onGuardar: () => void;
  onCerrar: () => void;
}

export default function ModalRolUsuario({ rol, onGuardar, onCerrar }: Props) {
  const [permisos, { mutate }] = createResource(
    () => rol?.id ?? -1,
    obtenerPermisosPorRol
  );
  const [cargando, setCargando] = createSignal(false);
  const [mensaje, setMensaje] = createSignal("");

  const togglePermiso = (id: number) => {
    if (!permisos()) return;
    mutate(
      permisos()!.map((permiso: PermisoUsuario) =>
        permiso.id === id
          ? { ...permiso, permitido: !permiso.permitido }
          : permiso
      )
    );
  };

  const permisosAgrupados = () => {
    if (!permisos()) return {};
    return permisos()!.reduce(
      (acc: Record<string, PermisoUsuario[]>, permiso: PermisoUsuario) => {
        const nombreModulo =
          typeof permiso.modulo === "object"
            ? permiso.modulo?.nombre
            : permiso.modulo || "Sin módulo";
        if (!acc[nombreModulo]) {
          acc[nombreModulo] = [];
        }
        acc[nombreModulo].push(permiso);
        return acc;
      },
      {}
    );
  };

  const handleGuardar = async () => {
    if (!rol) return;
    setCargando(true);
    await actualizarPermisosRol(rol.id, permisos()!);
    setCargando(false);
    setMensaje("Permisos actualizados correctamente"); // 🔥 mensaje éxito
    onGuardar();
  };

  return (
    <>
      <Show when={mensaje() !== ""}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>

      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-4xl overflow-y-auto max-h-[90vh] relative">
          {/* Botón X fija */}
          <button
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
            onClick={onCerrar}
          >
            ✕
          </button>

          <h2 class="text-xl font-bold mb-6">Editar permisos del rol</h2>

          <Show when={permisos.loading}>
            <div class="text-center">Cargando permisos...</div>
          </Show>

          <Show when={permisos()}>
            <div class="space-y-6">
              <For
                each={
                  Object.entries(permisosAgrupados()) as [
                    string,
                    PermisoUsuario[]
                  ][]
                }
              >
                {([modulo, permisosModulo]) => (
                  <div>
                    <h3 class="font-semibold text-gray-700 mb-2">{modulo}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <For each={permisosModulo}>
                        {(permiso) => (
                          <label class="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={permiso.permitido}
                              onChange={() => togglePermiso(permiso.id)}
                            />
                            <span>{permiso.accion}</span>
                          </label>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <div class="flex justify-end gap-2 mt-8">
            <button
              class="btn-secondary"
              onClick={onCerrar}
              disabled={cargando()}
            >
              Cancelar
            </button>
            <button
              class="btn-primary"
              onClick={handleGuardar}
              disabled={cargando()}
            >
              {cargando() ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
