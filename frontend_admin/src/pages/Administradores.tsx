import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show,
} from 'solid-js';
import {
  obtenerAdministradores,
  agregarAdministrador,
  editarAdministrador,
  eliminarAdministrador,
} from '../services/administrador.service';
import type { Usuario } from '../shared/types/usuario';
import ModalNuevoAdministrador from '../components/ModalNuevoAdministrador';
import VerAdministradorModal from '../components/VerAdministradorModal';
import ModalMensaje from '../components/ModalMensaje';
import ModalConfirmacion from '../components/ModalConfirmacion';

export default function Administradores() {
  const [busqueda, setBusqueda] = createSignal('');
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [adminSeleccionado, setAdminSeleccionado] = createSignal<Usuario | null>(null);
  const [verAdmin, setVerAdmin] = createSignal<Usuario | null>(null);

  const [modalMensaje, setModalMensaje] = createSignal('');
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [idAEliminar, setIdAEliminar] = createSignal<number | null>(null);

  const [respuesta, { refetch }] = createResource(obtenerAdministradores);

  const administradoresFiltrados = createMemo(() => {
    const buscar = busqueda().toLowerCase();
    return respuesta()?.filter((a) =>
      a.nombre?.toLowerCase().includes(buscar) ||
      a.email?.toLowerCase().includes(buscar) ||
      a.telefono?.includes(buscar)
    ) || [];
  });

  const confirmarEliminar = (id: number) => {
    setIdAEliminar(id);
    setModalConfirmar(true);
  };

  const handleEliminar = async () => {
    if (!idAEliminar()) return;
    await eliminarAdministrador(idAEliminar()!);
    setModalMensaje('Administrador eliminado correctamente');
    refetch();
  };

  const verDetalle = (a: Usuario) => {
    setVerAdmin(a);
  };

  const editarAdmin = (a: Usuario) => {
    setAdminSeleccionado(a);
    setModalAbierto(true);
  };

  const nuevoAdmin = () => {
    setAdminSeleccionado(null);
    setModalAbierto(true);
  };

  const handleGuardar = async (datos: Partial<Usuario>) => {
    if (adminSeleccionado()) {
      await editarAdministrador(adminSeleccionado()!.id, datos);
      setModalMensaje('Administrador editado correctamente');
    } else {
      await agregarAdministrador(datos);
      setModalMensaje('Administrador creado correctamente');
    }
    refetch();
    setModalAbierto(false);
    setAdminSeleccionado(null);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Administradores</h1>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            class="p-2 border rounded"
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />
          <button
            onClick={nuevoAdmin}
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            + Nuevo Admin
          </button>
        </div>
      </div>

      <div class="overflow-auto border rounded-lg">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-100">
            <tr>
              <th class="text-left p-3">Nombre</th>
              <th class="text-left p-3">Email</th>
              <th class="text-left p-3">Teléfono</th>
              <th class="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <Show
              when={administradoresFiltrados().length > 0}
              fallback={
                <tr>
                  <td colSpan={4} class="p-4 text-center text-gray-500">
                    No se encontraron administradores
                  </td>
                </tr>
              }
            >
              <For each={administradoresFiltrados()}>
                {(a) => (
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">{a.nombre}</td>
                    <td class="p-3">{a.email}</td>
                    <td class="p-3">{a.telefono || '-'}</td>
                    <td class="p-3 flex gap-2">
                      <button class="text-blue-600 hover:underline" onClick={() => verDetalle(a)}>
                        Ver
                      </button>
                      <button class="text-green-600 hover:underline" onClick={() => editarAdmin(a)}>
                        Editar
                      </button>
                      <button class="text-red-600 hover:underline" onClick={() => confirmarEliminar(a.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <ModalNuevoAdministrador
        abierto={modalAbierto()}
        cerrar={() => {
          setModalAbierto(false);
          setAdminSeleccionado(null);
        }}
        administrador={adminSeleccionado()}
        onGuardar={handleGuardar}
      />

      <VerAdministradorModal
        administrador={verAdmin()}
        abierto={verAdmin() !== null && !modalAbierto()}
        onCerrar={() => setVerAdmin(null)}
      />

      <ModalConfirmacion
        abierto={modalConfirmar()}
        onCancelar={() => setModalConfirmar(false)}
        onConfirmar={() => {
          setModalConfirmar(false);
          handleEliminar();
        }}
        mensaje="¿Estás seguro que querés eliminar este administrador?"
      />

      <ModalMensaje mensaje={modalMensaje()} cerrar={() => setModalMensaje('')} />
    </div>
  );
}
