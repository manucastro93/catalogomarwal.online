// src/pages/pagina/EstadosPedidos.tsx
import { createResource, createSignal, Show, For } from "solid-js";
import {
  obtenerEstadosPedido,
  eliminarEstadoPedido,
} from "../../services/estadoPedido.service";
import type { EstadoPedido } from "../../types/estadoPedido";
import ModalEstadoPedido from "../../components/Pagina/ModalEstadoPedido";
import ModalConfirmacion from "../../components/Layout/ModalConfirmacion";

export default function EstadosPedidos() {
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [estadoSeleccionado, setEstadoSeleccionado] =
    createSignal<EstadoPedido>();
  const [confirmarId, setConfirmarId] = createSignal<number | null>(null);
  const [reload, setReload] = createSignal(0);
  const [estados] = createResource(reload, obtenerEstadosPedido);

  const abrirNuevo = () => {
    setEstadoSeleccionado(undefined);
    setModalAbierto(true);
  };

  const abrirEdicion = (estado: EstadoPedido) => {
    setEstadoSeleccionado(estado);
    setModalAbierto(true);
  };

  const eliminar = async () => {
    if (confirmarId()) {
      await eliminarEstadoPedido(confirmarId()!);
      setReload((n) => n + 1);
    }
    setConfirmarId(null);
  };

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Estados de Pedidos</h1>
        <button class="btn-primary" onClick={abrirNuevo}>
          + Nuevo
        </button>
      </div>

      <Show when={estados()}>
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
            <For each={estados()}>
              {(estado) => (
                <tr>
                  <td class="p-2">{estado.id}</td>
                  <td class="p-2">{estado.nombre}</td>
                  <td class="p-2">{estado.descripcion || "-"}</td>
                  <td class="p-2 text-right">
                    <button
                      class="text-blue-600 mr-3"
                      onClick={() => abrirEdicion(estado)}
                    >
                      Editar
                    </button>
                    <button
                      class="text-red-600"
                      onClick={() => setConfirmarId(estado.id)}
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
        <ModalEstadoPedido
          estado={estadoSeleccionado()}
          onGuardar={() => setReload((n) => n + 1)}
          onCerrar={() => setModalAbierto(false)}
        />
      </Show>

      <ModalConfirmacion
        abierto={confirmarId() !== null}
        mensaje="¿Seguro que querés eliminar este estado?"
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarId(null)}
      />
    </div>
  );
}
