import { createResource, createSignal, Show, For } from "solid-js";
import {
  obtenerRolesUsuario,
  eliminarRolUsuario,
} from "../../services/rolUsuario.service";
import type { RolUsuario } from "../../types/rolUsuario";
import ModalRolUsuario from "../../components/Pagina/ModalRolUsuario";
import ModalConfirmacion from "../../components/Layout/ModalConfirmacion";

export default function RolesUsuarios() {
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [rolSeleccionado, setRolSeleccionado] = createSignal<RolUsuario>();
  const [confirmarId, setConfirmarId] = createSignal<number | null>(null);
  const [reload, setReload] = createSignal(0);
  const [roles] = createResource(reload, obtenerRolesUsuario);

  const abrirNuevo = () => {
    setRolSeleccionado(undefined);
    setModalAbierto(true);
  };

  const abrirEdicion = (rol: RolUsuario) => {
    setRolSeleccionado(rol);
    setModalAbierto(true);
  };

  const eliminar = async () => {
    if (confirmarId()) {
      await eliminarRolUsuario(confirmarId()!);
      setReload((n) => n + 1);
    }
    setConfirmarId(null);
  };

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Roles de Usuarios</h1>
        <button class="btn-primary" onClick={abrirNuevo}>
          + Nuevo
        </button>
      </div>

      <Show when={roles()}>
        <table class="w-full table-auto border">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="p-2">ID</th>
              <th class="p-2">Nombre</th>
              <th class="p-2">Descripción</th>
              <th class="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <For each={roles()}>
              {(rol) => (
                <tr>
                  <td class="p-2">{rol.id}</td>
                  <td class="p-2">{rol.nombre}</td>
                  <td class="p-2">{rol.descripcion || "-"}</td>
                  <td class="p-2 text-right">
                    <button
                      class="text-blue-600 mr-3"
                      onClick={() => abrirEdicion(rol)}
                    >
                      Editar
                    </button>
                    <button
                      class="text-red-600"
                      onClick={() => setConfirmarId(rol.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>

      <Show when={modalAbierto()}>
        <ModalRolUsuario
          rol={rolSeleccionado()}
          onGuardar={() => setReload((n) => n + 1)}
          onCerrar={() => setModalAbierto(false)}
        />
      </Show>

      <ModalConfirmacion
        abierto={confirmarId() !== null}
        mensaje="¿Seguro que querés eliminar este rol?"
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarId(null)}
      />
    </div>
  );
}
