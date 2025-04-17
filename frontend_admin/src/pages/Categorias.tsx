import {
  createSignal,
  createResource,
  For,
  Show
} from 'solid-js';
import { obtenerCategorias, eliminarCategoria } from '../services/categoria.service';
import ModalCategoria from '../components/ModalCategoria';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalMensaje from '../components/ModalMensaje';
import type { Categoria } from '../shared/types/categoria';
import { useAuth } from '../store/auth';
import Loader from '../components/Loader';

export default function Categorias() {
  const { usuario } = useAuth();
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = createSignal<Categoria | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = createSignal<Categoria | null>(null);
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [mensaje, setMensaje] = createSignal('');
  const [mostrarMensaje, setMostrarMensaje] = createSignal(false);

  const [categorias, { refetch }] = createResource(obtenerCategorias);

  const puedeEditar = () => ['supremo', 'administrador'].includes(usuario()?.rol || '');
  const puedeEliminar = () => usuario()?.rol === 'supremo';

  const confirmarEliminacion = async () => {
    if (!categoriaAEliminar()) return;
    await eliminarCategoria(categoriaAEliminar()!.id);
    setCategoriaAEliminar(null);
    setModalConfirmar(false);
    setMensaje('Categoría eliminada correctamente');
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
        <div class="overflow-auto border rounded-lg">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100">
              <tr>
                <th class="text-left p-3 border-b">Nombre</th>
                <th class="text-left p-3 border-b">Orden</th>
                <th class="text-left p-3 border-b">Estado</th>
                <th class="text-left p-3 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <Show when={categorias()?.length} fallback={<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay categorías</td></tr>}>
                <For each={categorias()}>{(c: Categoria) => (
                  <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3">{c.nombre}</td>
                    <td class="p-3">{c.orden ?? '-'}</td>
                    <td class="p-3">{c.estado ? 'Activa' : 'Inactiva'}</td>
                    <td class="p-3 flex gap-2">
                      <Show when={puedeEditar()}>
                        <button
                          class="text-green-600 hover:underline"
                          onClick={() => abrirModal(c)}
                        >Editar</button>
                      </Show>
                      <Show when={puedeEliminar()}>
                        <button
                          class="text-red-600 hover:underline"
                          onClick={() => {
                            setCategoriaAEliminar(c);
                            setModalConfirmar(true);
                          }}
                        >Eliminar</button>
                      </Show>
                    </td>
                  </tr>
                )}</For>
              </Show>
            </tbody>
          </table>
        </div>
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
        mensaje={`¿Estás seguro que querés eliminar la categoría "${categoriaAEliminar()?.nombre}"?`}
        onCancelar={() => {
          setCategoriaAEliminar(null);
          setModalConfirmar(false);
        }}
        onConfirmar={confirmarEliminacion}
      />

      <Show when={mostrarMensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMostrarMensaje(false)} />
      </Show>
    </div>
  );
}
