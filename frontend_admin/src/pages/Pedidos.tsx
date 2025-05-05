import { createSignal, createResource, createMemo, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '@/store/auth';
import { obtenerPedidos } from '@/services/pedido.service';
import { obtenerUsuariosPorRolPorId } from '@/services/usuario.service';
import { obtenerEstadosPedido } from '@/services/estadoPedido.service';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { Download } from 'lucide-solid';
import { exportarDatosAExcel } from '@/utils/exportarDatosAExcel';
import ModalActualizarEstadoPedido from '@/components/Pedido/ModalActualizarEstadoPedido';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import VerPedidoModal from '@/components/Pedido/VerPedidoModal';
import TablaPedidos from '@/components/Pedido/TablaPedidos';
import FiltrosPedidos from '@/components/Pedido/FiltrosPedidos';
import Loader from '@/components/Layout/Loader';
import type { Pedido } from '@/types/pedido';

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("createdAt");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [pedidoParaActualizar, setPedidoParaActualizar] = createSignal<Pedido | null>(null);
  const [mensaje, setMensaje] = createSignal("");
  const [busqueda, setBusqueda] = createSignal("");
  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal<number | undefined>(undefined);
  const [estadoSeleccionado, setEstadoSeleccionado] = createSignal<number | undefined>(undefined);
  const [verPedido, setVerPedido] = createSignal<Pedido | null>(null);

  const [vendedores] = createResource(async () => {
    const rol = usuario()?.rolUsuarioId as 1 | 2;
    if ([1, 2].includes(rol)) {
      return await obtenerUsuariosPorRolPorId(ROLES_USUARIOS.VENDEDOR);
    }
    return [];
  });

  const [estadosPedido] = createResource(obtenerEstadosPedido);

  const fetchParams = createMemo(() => ({
    pagina: pagina(),
    orden: orden(),
    direccion: direccion(),
    busqueda: busqueda(),
    vendedorId: vendedorSeleccionado(),
    estado: estadoSeleccionado(),
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerPedidos);

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const paginaActual = () => Number(respuesta()?.pagina || 1);
  const totalPaginas = () => Number(respuesta()?.totalPaginas || 1);

  async function exportarTodosLosPedidosFiltrados() {
    const res = await obtenerPedidos({ ...(fetchParams() as any), pagina: 1, limit: 9999 });

    exportarDatosAExcel(
      res.data,
      [
        { label: 'ID', key: 'id' },
        { label: 'Cliente', key: 'cliente.nombre' },
        { label: 'Vendedor', key: 'usuario.nombre' },
        { label: 'Estado', key: 'estado' },
        { label: 'Total', key: 'total' },
        { label: 'Fecha', key: 'createdAt' },
        { label: 'Observaciones', key: 'observaciones' },
      ],
      'Reporte Pedidos'
    );
  }

  return (
    <div class="p-6">
      <div class="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h1 class="text-2xl font-bold">Pedidos</h1>

        <div class="flex gap-2">
          <button
            onClick={exportarTodosLosPedidosFiltrados}
            class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <Download size={18} />
            Exportar Reporte
          </button>

          <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR}>
            <button
              onClick={() => navigate("/pedido-rapido")}
              class="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700 transition"
            >
              + Pedido rápido
            </button>
          </Show>
        </div>
      </div>

      <FiltrosPedidos
        busqueda={busqueda()}
        vendedorId={vendedorSeleccionado()}
        estado={estadoSeleccionado()}
        vendedores={vendedores() ?? []}
        estados={estadosPedido() ?? []}
        esVendedor={usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR}
        onBuscar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        onVendedorSeleccionado={(id) => {
          setVendedorSeleccionado(id);
          setPagina(1);
        }}
        onEstadoSeleccionado={(estadoId) => {
          setEstadoSeleccionado(estadoId || undefined);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaPedidos
          pedidos={respuesta()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          onVer={setVerPedido}
          onCambiarEstado={setPedidoParaActualizar}
          esVendedor={usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR}
        />
      </Show>

      <div class="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === 1}
        >
          ◀
        </button>

        <span class="text-sm">
          Página {paginaActual()} de {totalPaginas()}
        </span>

        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas(), p + 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() >= totalPaginas()}
        >
          ▶
        </button>
      </div>

      <VerPedidoModal pedido={verPedido()} onClose={() => setVerPedido(null)} />

      <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR}>
        <ModalActualizarEstadoPedido
          pedido={pedidoParaActualizar()}
          onCerrar={() => setPedidoParaActualizar(null)}
          onActualizado={() => refetch()}
        />
      </Show>

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>
    </div>
  );
}
