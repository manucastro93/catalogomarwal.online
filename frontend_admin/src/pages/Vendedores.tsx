import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import {
  obtenerVendedores,
  agregarVendedor,
  editarVendedor,
  eliminarVendedor,
} from "../services/vendedor.service";
import ModalNuevoVendedor from "../components/Usuario/ModalNuevoVendedor";
import VerVendedorModal from "../components/Usuario/VerVendedorModal";
import type { Vendedor } from "../types/vendedor";
import ModalMensaje from "../components/Layout/ModalMensaje";
import ModalConfirmacion from "../components/Layout/ModalConfirmacion";
import Loader from "../components/Layout/Loader";
import TablaVendedores from "../components/Usuario/TablaVendedores";
import FiltrosVendedores from "../components/Usuario/FiltrosVendedores";

export default function Vendedores() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("createdAt");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");

  const [busqueda, setBusqueda] = createSignal("");
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [vendedorSeleccionado, setVendedorSeleccionado] =
    createSignal<Vendedor | null>(null);
  const [verVendedor, setVerVendedor] = createSignal<Vendedor | null>(null);

  const [modalMensaje, setModalMensaje] = createSignal("");
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [idAEliminar, setIdAEliminar] = createSignal<string | null>(null);

  const [respuesta, { refetch }] = createResource(obtenerVendedores);

  const vendedoresFiltrados = createMemo(() => {
    const buscar = busqueda().toLowerCase();
    return (
      respuesta()?.filter(
        (v) =>
          v.nombre?.toLowerCase().includes(buscar) ||
          v.email?.toLowerCase().includes(buscar) ||
          v.telefono?.includes(buscar)
      ) || []
    );
  });

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const confirmarEliminar = (id: number) => {
    setIdAEliminar(String(id));
    setModalConfirmar(true);
  };

  const handleEliminar = async () => {
    if (!idAEliminar()) return;
    await eliminarVendedor(idAEliminar()!);
    setModalMensaje("Vendedor eliminado correctamente");
    refetch();
  };

  const verDetalle = (v: Vendedor) => {
    setVerVendedor(v);
  };

  const editarVendedorCompleto = (v: Vendedor) => {
    setVendedorSeleccionado(v);
    setModalAbierto(true);
  };

  const nuevoVendedor = () => {
    setVendedorSeleccionado(null);
    setModalAbierto(true);
  };

  const handleGuardarVendedor = async (
    datos: Partial<Omit<Vendedor, "id">>
  ) => {
    if (vendedorSeleccionado()?.id != null) {
      await editarVendedor(
        String(vendedorSeleccionado()!.id),
        datos as Partial<Omit<Vendedor, "id">>
      );
      setModalMensaje("Vendedor editado correctamente");
    } else {
      await agregarVendedor(datos);
      setModalMensaje("Vendedor creado correctamente");
    }
    refetch();
    setModalAbierto(false);
    setVendedorSeleccionado(null);
  };

  const copiarLink = async (id: string | number | undefined) => {
    try {
      const link = `https://www.catalogomarwal.online/${String(id || "")}`;
      await navigator.clipboard.writeText(link);
      setModalMensaje("¡Link copiado al portapapeles!");
    } catch (err) {
      setModalMensaje("Error al copiar el link");
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Vendedores</h1>
        <FiltrosVendedores
          busqueda={busqueda()}
          onBuscar={(valor) => setBusqueda(valor)}
          onNuevo={nuevoVendedor}
        />
      </div>

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaVendedores
          vendedores={vendedoresFiltrados()}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          onVer={verDetalle}
          onEditar={editarVendedorCompleto}
          onEliminar={confirmarEliminar}
          onCopiarLink={copiarLink}
        />
      </Show>

      <ModalNuevoVendedor
        abierto={modalAbierto()}
        cerrar={() => {
          setModalAbierto(false);
          setVendedorSeleccionado(null);
        }}
        vendedor={vendedorSeleccionado()}
        onGuardar={handleGuardarVendedor}
      />

      <VerVendedorModal
        vendedor={verVendedor()}
        abierto={verVendedor() !== null && !modalAbierto()}
        onCerrar={() => setVerVendedor(null)}
      />

      <ModalConfirmacion
        abierto={modalConfirmar()}
        onCancelar={() => setModalConfirmar(false)}
        onConfirmar={() => {
          setModalConfirmar(false);
          handleEliminar();
        }}
        mensaje="¿Estás seguro que querés eliminar este vendedor?"
      />

      <ModalMensaje
        mensaje={modalMensaje()}
        cerrar={() => setModalMensaje("")}
      />
    </div>
  );
}
