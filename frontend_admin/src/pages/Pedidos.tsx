import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show,
} from 'solid-js';
import {
  obtenerPedidos,
  eliminarPedido,
} from '../services/pedido.service';
import VerPedidoModal from '../components/VerPedidoModal';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalActualizarEstadoPedido from '../components/ModalActualizarEstadoPedido';
import { exportarPedidosExcel } from '../utils/exportarExcel';
import type { Pedido } from '../shared/types/pedido';
import { useAuth } from '../store/auth';
import ModalMensaje from '../components/ModalMensaje';

export default function Pedidos() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal('createdAt');
  const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('desc');
  const [pedidoParaActualizar, setPedidoParaActualizar] = createSignal<Pedido | null>(null);
  const [mensaje, setMensaje] = createSignal('');

  const [busqueda, setBusqueda] = createSignal('');

  const [verPedido, setVerPedido] = createSignal<Pedido | null>(null);
  const [pedidoAEliminar, setPedidoAEliminar] = createSignal<Pedido | null>(null);

  const fetchParams = createMemo(() => ({
    pagina: pagina(),
    orden: orden(),
    direccion: direccion(),
    busqueda: busqueda(),
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerPedidos);

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(col);
      setDireccion('asc');
    }
  };

  const handleEliminar = (id: number) => {
    setPedidoAEliminar(respuesta()?.data.find((p) => p.id === id) || null);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Pedidos</h1>
        <button
          onClick={() => respuesta()?.data && exportarPedidosExcel(respuesta()!.data)}
          class="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Exportar Excel
        </button>
      </div>

      <div class="mb-4">
        <input
          type="text"
          placeholder="Buscar por cliente, estado..."
          class="p-2 border rounded w-full max-w-md"
          value={busqueda()}
          onInput={(e) => {
            setBusqueda(e.currentTarget.value);
            setPagina(1);
          }}
        />
      </div>

      <div class="overflow-auto border rounded-lg">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('id')}>
                ID {orden() === 'id' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('clienteId')}>
                Cliente {orden() === 'clienteId' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('usuarioId')}>
                Vendedor {orden() === 'usuarioId' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('estado')}>
                Estado {orden() === 'estado' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b">Obs</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('total')}>
                Total {orden() === 'total' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('createdAt')}>
                Fecha {orden() === 'createdAt' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <Show
              when={respuesta()?.data?.length > 0}
              fallback={
                <tr>
                  <td colspan="8" class="text-center p-4 text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              }
            >
              <For each={respuesta()?.data}>
                {(p) => (
                  <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3">{p.id}</td>
                    <td class="p-3">{p.cliente?.nombre || '—'}</td>
                    <td class="p-3">{p.usuario?.nombre || '—'}</td>
                    <td class="p-3">{p.estado}</td>
                    <td class="p-3">{p.observaciones || '—'}</td>
                    <td class="p-3">${p.total}</td>
                    <td class="p-3">{new Date(p.createdAt).toLocaleString()}</td>
                    <td class="p-3 flex gap-2">
                      <button class="text-blue-600 hover:underline" onClick={() => setVerPedido(p)}>
                        Ver
                      </button>
                      <Show when={usuario()?.rol !== 'vendedor'}>
                        <>
                          <button class="text-red-600 hover:underline" onClick={() => handleEliminar(p.id)}>
                            Eliminar
                          </button>
                          <button
                            class="text-yellow-600 hover:underline"
                            onClick={() => setPedidoParaActualizar(p)}
                          >
                            Cambiar estado
                          </button>
                        </>
                      </Show>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <div class="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === 1}
        >
          ◀
        </button>
        <span class="text-sm">
          Página {respuesta()?.pagina} de {respuesta()?.totalPaginas}
        </span>
        <button
          onClick={() =>
            setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))
          }
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === respuesta()?.totalPaginas}
        >
          ▶
        </button>
      </div>

      <VerPedidoModal
        pedido={verPedido()}
        onClose={() => setVerPedido(null)}
      />

      <Show when={usuario()?.rol !== 'vendedor'}>
        <ModalActualizarEstadoPedido
          pedido={pedidoParaActualizar()}
          onCerrar={() => setPedidoParaActualizar(null)}
          onActualizado={() => refetch()}
        />
      </Show>

      <ModalConfirmacion
        mensaje="¿Estás seguro de que querés eliminar este pedido?"
        abierto={!!pedidoAEliminar()}
        onCancelar={() => setPedidoAEliminar(null)}
        onConfirmar={async () => {
          if (pedidoAEliminar()) {
            await eliminarPedido(pedidoAEliminar()!.id);
            setPedidoAEliminar(null);
            setMensaje('Pedido eliminado correctamente');
            refetch();
          }
        }}
      />

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
      </Show>
    </div>
  );
}
