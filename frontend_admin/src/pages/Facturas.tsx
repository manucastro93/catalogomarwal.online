import { createSignal, createResource, createMemo, Show } from "solid-js";
import { obtenerFacturas, obtenerEstadosFactura } from "@/services/factura.service";
import { obtenerUsuariosPorRolPorId } from "@/services/usuario.service";
import { ROLES_USUARIOS } from "@/constants/rolesUsuarios";
import { useAuth } from "@/store/auth";
import TablaFacturasDux from "@/components/Factura/TablaFacturas";
import FiltrosFacturas from "@/components/Factura/FiltrosFacturas";
import type { FacturaDux } from "@/types/factura";
import type { Usuario } from "@/types/usuario";

export default function Facturas() {
  const { usuario } = useAuth();

  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("fecha_comp");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [busqueda, setBusqueda] = createSignal("");
  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal<number | undefined>(undefined);
  const [estadoSeleccionado, setEstadoSeleccionado] = createSignal<number | undefined>(undefined);
  const [fechaDesde, setFechaDesde] = createSignal("");
  const [fechaHasta, setFechaHasta] = createSignal("");

  const [vendedores] = createResource(async () => {
  const rol = usuario()?.rolUsuarioId;
  if (rol === 1 || rol === 2) {
    return await obtenerUsuariosPorRolPorId(ROLES_USUARIOS.VENDEDOR);
  }
  return [];
});


  const [estadosFactura] = createResource(obtenerEstadosFactura);

  const fetchParams = createMemo(() => ({
    pagina: pagina(),
    orden: orden(),
    direccion: direccion(),
    busqueda: busqueda(),
    vendedorId: vendedorSeleccionado(),
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

      <Show when={!respuesta.loading}>
        <TablaFacturasDux
          facturas={respuesta()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
        />
      </Show>
    </div>
  );
}
