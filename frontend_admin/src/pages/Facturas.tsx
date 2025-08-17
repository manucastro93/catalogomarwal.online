import { createSignal, createResource, createMemo, Show } from "solid-js";
import { obtenerFacturas, obtenerEstadosFactura } from "@/services/factura.service";
import { obtenerUsuariosPorRolPorId, obtenerUsuarios } from "@/services/usuario.service";
import { obtenerPersonalDux } from "@/services/personalDux.service"
import { ROLES_USUARIOS } from "@/constants/rolesUsuarios";
import { useAuth } from "@/store/auth";
import TablaFacturasDux from "@/components/Factura/TablaFacturas";
import FiltrosFacturas from "@/components/Factura/FiltrosFacturas";
import Loader from "@/components/Layout/Loader";
import VerFacturaDuxModal from "@/components/Factura/VerFacturaDuxModal";
import type { FacturaDux } from "@/types/factura";

export default function Facturas() {
  const { usuario } = useAuth();
  const [facturaSeleccionada, setFacturaSeleccionada] = createSignal<FacturaDux | null>(null);
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("fecha_comp");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [busqueda, setBusqueda] = createSignal("");
  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal<number | undefined>(undefined);
  const [estadoSeleccionado, setEstadoSeleccionado] = createSignal<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = createSignal("");
  const [fechaHasta, setFechaHasta] = createSignal("");

  const [vendedores] = createResource(obtenerPersonalDux);

  const [estadosFactura] = createResource(obtenerEstadosFactura);

  const fetchParams = createMemo(() => ({
    pagina: pagina(),
    orden: orden(),
    direccion: direccion(),
    busqueda: busqueda(),
    personalDuxId: vendedorSeleccionado(),
    estadoId: estadoSeleccionado(),
    fechaDesde: fechaDesde(),
    fechaHasta: fechaHasta(),
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerFacturas);

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

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Facturas</h1>

      <FiltrosFacturas
        busqueda={busqueda()}
        vendedorId={vendedorSeleccionado()}
        estadoId={estadoSeleccionado()}
        esVendedor={usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR}
        vendedores={vendedores() ?? []}
        estados={estadosFactura() ?? []}
        fechaDesde={fechaDesde()}
        fechaHasta={fechaHasta()}
        onBuscar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        onVendedorSeleccionado={(id) => {
          setVendedorSeleccionado(id);
          setPagina(1);
        }}
        onEstadoSeleccionado={(id) => {
          setEstadoSeleccionado(id);
          setPagina(1);
        }}
        onFechaDesde={(f) => {
          setFechaDesde(f);
          setPagina(1);
        }}
        onFechaHasta={(f) => {
          setFechaHasta(f);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaFacturasDux
          facturas={respuesta()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          onVer={(factura) => setFacturaSeleccionada(factura)} // 👈 abrimos modal
        />
      </Show>

      {/* Paginación */}
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

      {/* Modal */}
      <Show when={facturaSeleccionada()}>
        <VerFacturaDuxModal
          factura={facturaSeleccionada()}
          onClose={() => setFacturaSeleccionada(null)}
        />
      </Show>
    </div>
  );
}
