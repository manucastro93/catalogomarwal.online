import { createSignal, createResource, For, Show } from 'solid-js';
import { obtenerCategorias, eliminarCategoria } from '@/services/categoria.service';
import ModalCategoria from '@/components/Categoria/ModalCategoria';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import Loader from '@/components/Layout/Loader';
import TablaCategorias from '@/components/Categoria/TablaCategorias';
import { useAuth } from '@/store/auth';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { Categoria } from '@/types/categoria';

export default function Categorias() {
  const { usuario } = useAuth();
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    createSignal<Categoria | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] =
    createSignal<Categoria | null>(null);
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [mensaje, setMensaje] = createSignal("");
  const [mostrarMensaje, setMostrarMensaje] = createSignal(false);

  const [categorias, { refetch }] = createResource(obtenerCategorias);

  const puedeEditar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as (typeof ROLES_USUARIOS)["SUPREMO"] | (typeof ROLES_USUARIOS)["ADMINISTRADOR"]
    );
  

  const puedeEliminar = () => usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO;

  const confirmarEliminacion = async () => {
    if (!categoriaAEliminar()) return;
    await eliminarCategoria(categoriaAEliminar()!.id);
    setCategoriaAEliminar(null);
    setModalConfirmar(false);
    setMensaje("Categoría eliminada correctamente");
    setMostrarMensaje(true);
    refetch();
  };

  const abrirModal = (categoria: Categoria | null) => {
    setCategoriaSeleccionada(categoria);
    setModalAbierto(true);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Categorías</h1>
        <Show when={puedeEditar()}>
          <button
            onClick={() => abrirModal(null)}
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            + Nueva Categoría
          </button>
        </Show>
      </div>

      <Show when={!categorias.loading} fallback={<Loader />}>
        <TablaCategorias
          categorias={categorias()?.data ?? []}
          puedeEditar={puedeEditar()}
          puedeEliminar={puedeEliminar()}
          onEditar={abrirModal}
          onEliminar={(c) => {
            setCategoriaAEliminar(c);
            setModalConfirmar(true);
          }}
        />
      </Show>

      <ModalCategoria
        abierto={modalAbierto()}
        categoria={categoriaSeleccionada() || null}
        onCerrar={(mensajeExito?: string) => {
          setModalAbierto(false);
          setCategoriaSeleccionada(null);
          if (mensajeExito) {
            setMensaje(mensajeExito);
            setMostrarMensaje(true);
          }
          refetch();
        }}
      />

      <ModalConfirmacion
        abierto={modalConfirmar()}
        mensaje={`¿Estás seguro que querés eliminar la categoría "${
          categoriaAEliminar()?.nombre
        }"?`}
        onCancelar={() => {
          setCategoriaAEliminar(null);
          setModalConfirmar(false);
        }}
        onConfirmar={confirmarEliminacion}
      />

      <Show when={mostrarMensaje()}>
        <ModalMensaje
          mensaje={mensaje()}
          cerrar={() => setMostrarMensaje(false)}
        />
      </Show>
    </div>
  );
}
