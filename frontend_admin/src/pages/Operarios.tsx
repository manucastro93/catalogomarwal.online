import { createSignal, createResource, createMemo, Show } from 'solid-js';
import { obtenerUsuariosOperarios, eliminarUsuario } from '@/services/usuario.service';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import TablaOperarios from '@/components/Usuario/Operario/TablaOperarios';
import FiltrosOperarios from '@/components/Usuario/Operario/FiltrosOperarios';
import ModalNuevoOperario from '@/components/Usuario/Operario/ModalNuevoOperario';
import VerOperarioModal from '@/components/Usuario/Operario/VerOperarioModal';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import { useAuth } from '@/store/auth';

export default function Operarios() {
  const { usuario } = useAuth();

  const [busqueda, setBusqueda] = createSignal("");
  const [orden, setOrden] = createSignal("nombre");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("asc");

  const [operarioSeleccionado, setOperarioSeleccionado] =
    createSignal<any>(null);
  const [modalVerAbierto, setModalVerAbierto] = createSignal(false);
  const [modalNuevoAbierto, setModalNuevoAbierto] = createSignal(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = createSignal(false);
  const [idEliminar, setIdEliminar] = createSignal<number | null>(null);
  const [mensajeExito, setMensajeExito] = createSignal("");

  const cerrarModalMensaje = () => {
    setMensajeExito("");
  };

  const [operarios, { refetch }] = createResource(() =>
    obtenerUsuariosOperarios()
  );
  

  const operariosFiltrados = createMemo(() => {
    const texto = busqueda().toLowerCase().trim();
    return (operarios() || []).filter(
      (v) =>
        v.nombre.toLowerCase().includes(texto) ||
        v.email.toLowerCase().includes(texto)
    );
  });

  const puedeEliminar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as
        | (typeof ROLES_USUARIOS)["SUPREMO"]
        | (typeof ROLES_USUARIOS)["ADMINISTRADOR"]
    );

  const puedeEditar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as
        | (typeof ROLES_USUARIOS)["SUPREMO"]
        | (typeof ROLES_USUARIOS)["ADMINISTRADOR"]
    );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const confirmarEliminar = (id: number) => {
    setIdEliminar(id);
    setModalConfirmarAbierto(true);
  };

  const eliminar = async () => {
    if (!idEliminar()) return;
    try {
      await eliminarUsuario(idEliminar()!, "Operarios");
      setMensajeExito("Operario eliminado correctamente");
      setModalConfirmarAbierto(false);
      setIdEliminar(null);
      await refetch();
    } catch (error) {
      console.error(error);
      setMensajeExito("Error al eliminar operario");
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Operarios</h1>
      </div>

      <FiltrosOperarios
        busqueda={busqueda()}
        onBuscar={setBusqueda}
        onNuevo={() => {
          setOperarioSeleccionado(null);
          setModalNuevoAbierto(true);
        }}
      />

      <Show when={!operarios.loading}>
        <TablaOperarios
          operarios={operariosFiltrados()}
          orden={orden()}
          direccion={direccion()}
          puedeEditar={puedeEditar()}
          puedeEliminar={puedeEliminar()}
          onOrdenar={cambiarOrden}
          onVer={(v) => {
            setOperarioSeleccionado(() => v);
            setModalVerAbierto(true);
          }}
          onEditar={(v) => {
            setOperarioSeleccionado(() => v);
            setModalNuevoAbierto(true);
          }}
          onEliminar={(id) => confirmarEliminar(id)}
        />
      </Show>

      <VerOperarioModal
        abierto={modalVerAbierto()}
        usuario={operarioSeleccionado()}
        onCerrar={() => setModalVerAbierto(false)}
      />

      <ModalNuevoOperario
        abierto={modalNuevoAbierto()}
        usuario={operarioSeleccionado()}
        cerrar={() => {
          setModalNuevoAbierto(false);
          refetch();
        }}
        onExito={(mensaje: string) => setMensajeExito(mensaje)}
      />

      <ModalMensaje mensaje={mensajeExito()} cerrar={cerrarModalMensaje} />

      <ModalConfirmacion
        abierto={modalConfirmarAbierto()}
        mensaje="¿Seguro que querés eliminar este operario?"
        onConfirmar={async () => {
          await eliminar();
        }}
        onCancelar={() => setModalConfirmarAbierto(false)}
      />
    </div>
  );
}
