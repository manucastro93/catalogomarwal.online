import { createResource, createSignal, Show, For } from "solid-js";
import {
  obtenerUsuarios,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
} from "@/services/usuario.service";
import { obtenerRolesUsuario } from "@/services/rolUsuario.service";
import ModalNuevoAdministrador from "@/components/Usuario/Administrador/ModalNuevoAdministrador";
import ModalConfirmacion from "@/components/Layout/ModalConfirmacion";
import ModalMensaje from "@/components/Layout/ModalMensaje";
import type { Usuario } from "@/types/usuario";

type SortDir = "ASC" | "DESC";
type SortCol = "id" | "nombre" | "email" | "telefono" | "rol";

// opción simple para el dropdown de roles
type RolOption = { id: number; nombre: string };

export default function Usuarios() {
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [adminSeleccionado, setAdminSeleccionado] = createSignal<Usuario | undefined>();
  const [confirmarId, setConfirmarId] = createSignal<number | null>(null);
  const [reload, setReload] = createSignal(0);
  const [mensajeExito, setMensajeExito] = createSignal("");

  // Filtros / orden
  const [q, setQ] = createSignal("");           // buscar por nombre/email
  const [rolId, setRolId] = createSignal("");   // "" = Todos
  const [sortBy, setSortBy] = createSignal<SortCol>("id");
  const [sortDir, setSortDir] = createSignal<SortDir>("ASC");

  // 🔒 roles: recurso independiente (no derivado de admins), sin flicker
  const [roles] = createResource<RolOption[]>(
    async () => {
      const rs = await obtenerRolesUsuario(); // asume devuelve [{id, nombre, ...}]
      return rs.map((r: any) => ({ id: r.id, nombre: r.nombre }));
    },
    { initialValue: [] } // tipos correctos para la sobrecarga elegida
  );

  // 🔑 key estable para usuarios (evita rarezas en refetch)
  const key = () =>
    `r:${reload()}|q:${q()}|rol:${rolId()}|sb:${sortBy()}|sd:${sortDir()}`;

  const [admins] = createResource(
    key,
    () =>
      obtenerUsuarios({
        q: q() || undefined,
        rolId: rolId() === "" ? undefined : rolId(),
        sortBy: sortBy(),
        sortDir: sortDir(),
      }),
    { initialValue: [] as Usuario[] }
  );

  const abrirNuevo = () => {
    setAdminSeleccionado(undefined);
    setModalAbierto(true);
  };
  const abrirEdicion = (u: Usuario) => {
    setAdminSeleccionado(u);
    setModalAbierto(true);
  };

  const eliminar = async () => {
    if (!confirmarId()) return;
    try {
      await eliminarUsuario(confirmarId()!);
      setMensajeExito("Usuario eliminado correctamente");
      setReload((n) => n + 1);
    } catch (e) {
      console.error(e);
      setMensajeExito("Error al eliminar usuario");
    } finally {
      setConfirmarId(null);
    }
  };

  const guardar = async (datos: Partial<Usuario>) => {
    try {
      if (adminSeleccionado()) {
        await editarUsuario(adminSeleccionado()!.id, datos);
        setMensajeExito("Usuario editado correctamente");
      } else {
        await crearUsuario({ ...datos, rolUsuarioId: 2 });
        setMensajeExito("Usuario creado correctamente");
      }
      setModalAbierto(false);
      setAdminSeleccionado(undefined);
      setReload((n) => n + 1);
    } catch (e) {
      console.error(e);
      setMensajeExito("Error al guardar Usuario");
    }
  };

  const toggleSort = (col: SortCol) => {
    if (sortBy() === col) setSortDir(sortDir() === "ASC" ? "DESC" : "ASC");
    else { setSortBy(col); setSortDir("ASC"); }
  };
  const sortIndicator = (col: SortCol) =>
    sortBy() !== col ? "↕" : sortDir() === "ASC" ? "▲" : "▼";

  return (
    <div class="p-4">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
        <h1 class="text-2xl font-bold">Usuarios</h1>
        <div class="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            class="border rounded px-3 py-2 text-sm w-56"
            value={q()}
            onInput={(e) => setQ(e.currentTarget.value)}
          />
          <select
            class="border rounded px-3 py-2 text-sm"
            value={rolId()}
            onInput={(e) => setRolId(e.currentTarget.value)} // como en tu ejemplo
          >
            <option value="">Todos los roles</option>
            <For each={roles()}>
              {(r) => <option value={String(r.id)}>{r.nombre}</option>}
            </For>
          </select>
          <button
            class="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-xl text-sm font-semibold shadow"
            onClick={abrirNuevo}
          >
            + Nuevo
          </button>
        </div>
      </div>

      <Show when={admins()}>
        <div class="overflow-auto border rounded-lg">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="p-3 cursor-pointer select-none" onClick={() => toggleSort("id")}>
                  <div class="flex items-center gap-2">
                    <span>ID</span><span class="text-gray-500">{sortIndicator("id")}</span>
                  </div>
                </th>
                <th class="p-3 cursor-pointer select-none" onClick={() => toggleSort("nombre")}>
                  <div class="flex items-center gap-2">
                    <span>Nombre</span><span class="text-gray-500">{sortIndicator("nombre")}</span>
                  </div>
                </th>
                <th class="p-3 cursor-pointer select-none" onClick={() => toggleSort("email")}>
                  <div class="flex items-center gap-2">
                    <span>Email</span><span class="text-gray-500">{sortIndicator("email")}</span>
                  </div>
                </th>
                <th class="p-3 cursor-pointer select-none" onClick={() => toggleSort("telefono")}>
                  <div class="flex items-center gap-2">
                    <span>Teléfono</span><span class="text-gray-500">{sortIndicator("telefono")}</span>
                  </div>
                </th>
                <th class="p-3 cursor-pointer select-none" onClick={() => toggleSort("rol")}>
                  <div class="flex items-center gap-2">
                    <span>Rol</span><span class="text-gray-500">{sortIndicator("rol")}</span>
                  </div>
                </th>
                <th class="p-3">Personal Dux</th>
                <th class="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <For each={admins()}>
                {(a) => (
                  <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3">{a.id}</td>
                    <td class="p-3">{a.nombre}</td>
                    <td class="p-3">{a.email}</td>
                    <td class="p-3">{a.telefono || "-"}</td>
                    <td class="p-3">{a.rolUsuario?.nombre}</td>
                    <td class="p-3">
                      {a.personalDux?.apellido_razon_social} {a.personalDux?.nombre}
                    </td>
                    <td class="p-2 text-right whitespace-nowrap">
                      <button class="text-blue-600 mr-3" onClick={() => abrirEdicion(a)}>
                        Editar
                      </button>
                      <button class="text-red-600" onClick={() => setConfirmarId(a.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Show when={modalAbierto()}>
        <ModalNuevoAdministrador
          abierto={modalAbierto()}
          administrador={adminSeleccionado() ?? null}
          onGuardar={guardar}
          cerrar={() => setModalAbierto(false)}
        />
      </Show>

      <ModalConfirmacion
        abierto={confirmarId() !== null}
        mensaje="¿Seguro que querés eliminar este administrador?"
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarId(null)}
      />

      <ModalMensaje mensaje={mensajeExito()} cerrar={() => setMensajeExito("")} />
    </div>
  );
}
