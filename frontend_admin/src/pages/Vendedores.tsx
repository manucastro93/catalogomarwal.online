import { createSignal, createResource, createMemo, Show } from "solid-js";
import { obtenerUsuariosPorRolPorId, eliminarUsuario } from "../services/usuario.service";
import { ROLES_USUARIOS } from "../constants/rolesUsuarios";
import FiltrosVendedores from "../components/Usuario/Vendedor/FiltrosVendedores";
import TablaVendedores from "../components/Usuario/Vendedor/TablaVendedores";
import ModalNuevoVendedor from "../components/Usuario/Vendedor/ModalNuevoVendedor";
import VerVendedorModal from "../components/Usuario/Vendedor/VerVendedorModal";
import ModalConfirmacion from "../components/Layout/ModalConfirmacion";
import ModalMensaje from "../components/Layout/ModalMensaje";
import { useAuth } from "../store/auth";

export default function Vendedores() {
  const { usuario } = useAuth();
  
  const [busqueda, setBusqueda] = createSignal("");
  const [orden, setOrden] = createSignal("nombre");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("asc");

  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal<any>(null);
  const [modalVerAbierto, setModalVerAbierto] = createSignal(false);
  const [modalNuevoAbierto, setModalNuevoAbierto] = createSignal(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = createSignal(false);
  const [idEliminar, setIdEliminar] = createSignal<number | null>(null);
  const [mensaje, setMensaje] = createSignal('');

  const [vendedores, { refetch }] = createResource(() =>
    obtenerUsuariosPorRolPorId(ROLES_USUARIOS.VENDEDOR)
  );

  const vendedoresFiltrados = createMemo(() => {
    const texto = busqueda().toLowerCase().trim();
    return (vendedores() || []).filter((v) =>
      v.nombre.toLowerCase().includes(texto) || v.email.toLowerCase().includes(texto)
    );
  });

  const puedeEliminar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as (typeof ROLES_USUARIOS)["SUPREMO"] | (typeof ROLES_USUARIOS)["ADMINISTRADOR"]
    );

  const puedeEditar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as (typeof ROLES_USUARIOS)["SUPREMO"] | (typeof ROLES_USUARIOS)["ADMINISTRADOR"]
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
    if (idEliminar()) {
      await eliminarUsuario(idEliminar()!, "Vendedores");
      await refetch();
      setModalConfirmarAbierto(false);
      setMensaje('Vendedor eliminado correctamente');
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Vendedores</h1>
      </div>

      <FiltrosVendedores
        busqueda={busqueda()}
        onBuscar={setBusqueda}
        onNuevo={() => {
          setVendedorSeleccionado(null);
          setModalNuevoAbierto(true);
        }}
      />

      <Show when={!vendedores.loading}>
        <TablaVendedores
          vendedores={vendedoresFiltrados()}
          orden={orden()}
          direccion={direccion()}
          puedeEditar={puedeEditar()}
          puedeEliminar={puedeEliminar()}
          onOrdenar={cambiarOrden}
          onVer={(v) => {
            setVendedorSeleccionado(() => v);
            setModalVerAbierto(true);
          }}
          onEditar={(v) => {
            setVendedorSeleccionado(() => v);
            setModalNuevoAbierto(true);
          }}
          onEliminar={(id) => confirmarEliminar(id)}
          onCopiarLink={(link) =>
            navigator.clipboard.writeText(`https://catalogomarwal.online/${link}`)
          }
        />
      </Show>

      <VerVendedorModal
        abierto={modalVerAbierto()}
        usuario={vendedorSeleccionado()}
        onCerrar={() => setModalVerAbierto(false)}
      />

      <ModalNuevoVendedor
        abierto={modalNuevoAbierto()}
        usuario={vendedorSeleccionado()}
        onCerrar={async (mensajeExito?: string) => {
          setModalNuevoAbierto(false);
          await refetch();
          if (mensajeExito) setMensaje(mensajeExito);
        }}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />

      <ModalConfirmacion
        abierto={modalConfirmarAbierto()}
        mensaje="¿Seguro que querés eliminar este vendedor?"
        onConfirmar={eliminar}
        onCancelar={() => setModalConfirmarAbierto(false)}
      />
    </div>
  );
}
