import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import {
  obtenerUsuariosPorRolPorId,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
} from "../services/usuario.service";
import type { Usuario } from "../types/usuario";
import ModalNuevoAdministrador from "../components/Usuario/Administrador/ModalNuevoAdministrador";
import VerAdministradorModal from "../components/Usuario/Administrador/VerAdministradorModal";
import ModalMensaje from "../components/Layout/ModalMensaje";
import ModalConfirmacion from "../components/Layout/ModalConfirmacion";
import TablaAdministradores from "../components/Usuario/Administrador/TablaAdministradores";
import { ROLES_USUARIOS } from "../constants/rolesUsuarios";

export default function Administradores() {
  const [busqueda, setBusqueda] = createSignal("");
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [adminSeleccionado, setAdminSeleccionado] = createSignal<Usuario | null>(null);
  const [verAdmin, setVerAdmin] = createSignal<Usuario | null>(null);
  const [modalMensaje, setModalMensaje] = createSignal("");
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [idAEliminar, setIdAEliminar] = createSignal<number | null>(null);

  const [respuesta, { refetch }] = createResource(() =>
      obtenerUsuariosPorRolPorId(ROLES_USUARIOS.ADMINISTRADOR)
    );

  const administradoresFiltrados = createMemo(() => {
    const buscar = busqueda().toLowerCase();
    return (
      respuesta()?.filter(
        (a) =>
          a.nombre?.toLowerCase().includes(buscar) ||
          a.email?.toLowerCase().includes(buscar) ||
          a.telefono?.includes(buscar)
      ) || []
    );
  });

  const confirmarEliminar = (id: number) => {
    setIdAEliminar(id);
    setModalConfirmar(true);
  };

  const handleEliminar = async () => {
    if (!idAEliminar()) return;
    try {
      await eliminarUsuario(idAEliminar()!, "Administradores");
      setModalMensaje("Administrador eliminado correctamente");
      refetch();
    } catch (error) {
      console.error(error);
      setModalMensaje("Error al eliminar administrador");
    }
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
    try {
      if (adminSeleccionado()) {
        await editarUsuario(adminSeleccionado()!.id, datos, "Administradores"); 
        setModalMensaje("Administrador editado correctamente");
      } else {
        await crearUsuario({ ...datos, rolUsuarioId: 2 }, "Administradores");
        setModalMensaje("Administrador creado correctamente");
      }
      refetch();
      setModalAbierto(false);
      setAdminSeleccionado(null);
    } catch (error) {
      console.error(error);
      setModalMensaje("Error al guardar administrador");
    }
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

      <TablaAdministradores
        administradores={administradoresFiltrados()}
        onVer={verDetalle}
        onEditar={editarAdmin}
        onEliminar={confirmarEliminar}
      />

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

      <ModalMensaje
        mensaje={modalMensaje()}
        cerrar={() => setModalMensaje("")}
      />
    </div>
  );
}
