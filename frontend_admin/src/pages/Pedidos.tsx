import { createSignal, createResource, createMemo, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

import { obtenerPedidos, eliminarPedido } from "../services/pedido.service";
import VerPedidoModal from "../components/Pedido/VerPedidoModal";
import ModalConfirmacion from "../components/Layout/ModalConfirmacion";
import ModalActualizarEstadoPedido from "../components/Pedido/ModalActualizarEstadoPedido";
import { exportarPedidosExcel } from "../utils/exportarExcel";
import type { Pedido } from "../types/pedido";
import { useAuth } from "../store/auth";
import ModalMensaje from "../components/Layout/ModalMensaje";
import Loader from "../components/Layout/Loader";
import { obtenerVendedores } from "../services/vendedor.service";
import { formatearPrecio } from "../utils/formato";
import TablaPedidos from "../components/Pedido/TablaPedidos";
import FiltrosPedidos from "../components/Pedido/FiltrosPedidos";

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("createdAt");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [pedidoParaActualizar, setPedidoParaActualizar] =
    createSignal<Pedido | null>(null);
  const [mensaje, setMensaje] = createSignal("");

  const [busqueda, setBusqueda] = createSignal("");
  const [vendedores] = createResource(obtenerVendedores);
  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal("");
  const [estadoSeleccionado, setEstadoSeleccionado] = createSignal("");
  const [verPedido, setVerPedido] = createSignal<Pedido | null>(null);
  const [pedidoAEliminar, setPedidoAEliminar] = createSignal<Pedido | null>(
    null
  );

  const fetchParams = createMemo(() => ({
    pagina: pagina(),
    orden: orden(),
    direccion: direccion(),
    busqueda: busqueda(),
    vendedorId: vendedorSeleccionado() || undefined,
    estado: estadoSeleccionado() || undefined,
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

  const handleEliminar = (id: number) => {
    setPedidoAEliminar(respuesta()?.data.find((p) => p.id === id) || null);
  };

  const paginaActual = () => Number(respuesta()?.pagina || 1);
  const totalPaginas = () => Number(respuesta()?.totalPaginas || 1);

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Pedidos</h1>
        <button
          onClick={() =>
            respuesta()?.data && exportarPedidosExcel(respuesta()!.data)
          }
          class="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          Exportar Excel
        </button>
        <Show when={usuario()?.rol === "vendedor"}>
          <button
            onClick={() => navigate("/pedido-rapido")}
            class="bg-purple-600 text-white px-4 py-1 rounded text-sm hover:bg-purple-700 transition"
          >
            + Pedido rápido
          </button>
        </Show>
      </div>

      <FiltrosPedidos
        busqueda={busqueda()}
        vendedorId={vendedorSeleccionado()}
        estado={estadoSeleccionado()}
        esVendedor={usuario()?.rol === "vendedor"}
        vendedores={vendedores() ?? []}
        onBuscar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        onVendedorSeleccionado={(id) => {
          setVendedorSeleccionado(id);
          setPagina(1);
        }}
        onEstadoSeleccionado={(estado) => {
          setEstadoSeleccionado(estado);
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
          esVendedor={usuario()?.rol === "vendedor"}
        />
      </Show>

      <div class="flex justify-center items-center gap-2 mt-4">
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

      <Show when={usuario()?.rol !== "vendedor"}>
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
            setMensaje("Pedido eliminado correctamente");
            refetch();
          }
        }}
      />

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>
    </div>
  );
}
