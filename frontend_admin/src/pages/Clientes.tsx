import { createSignal, createResource, createMemo, Show } from 'solid-js';
import * as XLSX from 'xlsx';
import { obtenerClientes } from '@/services/cliente.service';
import { obtenerClientesDux } from '@/services/clienteDux.service';
import { obtenerProvincias, obtenerLocalidades } from '@/services/ubicacion.service';
import { obtenerUsuariosPorRolPorId } from '@/services/usuario.service';
import { useAuth } from '@/store/auth';
import VerClienteModal from '@/components/Cliente/VerClienteModal';
import ModalMapaClientesDux from '@/components/Cliente/ModalMapaClientesDux';
import TablaClientes from '@/components/Cliente/TablaClientes';
import FiltrosClientes from '@/components/Cliente/FiltrosClientes';
import Loader from '@/components/Layout/Loader';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { Cliente } from '@/types/cliente';
import { formatearFechaCorta } from '@/utils/formato';

export default function Clientes() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("createdAt");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [busqueda, setBusqueda] = createSignal("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = createSignal<
    number | ""
  >("");
  const [localidadSeleccionada, setLocalidadSeleccionada] = createSignal<
    number | ""
  >("");
  const [vendedorIdSeleccionado, setVendedorIdSeleccionado] = createSignal<
    number | ""
  >("");

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [verCliente, setVerCliente] = createSignal<Cliente | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = createSignal<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = createSignal<Cliente | null>(null);
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [mostrarMapa, setMostrarMapa] = createSignal(false);
  const [soloClientesDux, setSoloClientesDux] = createSignal(false);

  const [vendedores] = createResource(async () => {
    if (usuario()?.rolUsuarioId && [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(usuario()!.rolUsuarioId as typeof ROLES_USUARIOS.SUPREMO | typeof ROLES_USUARIOS.ADMINISTRADOR)) {
      return await obtenerUsuariosPorRolPorId(ROLES_USUARIOS.VENDEDOR);
    }
    return [];
  });


  const [provincias] = createResource(obtenerProvincias);
  const [localidades] = createResource(
    () => provinciaSeleccionada(),
    (id) => (id ? obtenerLocalidades(Number(id)) : Promise.resolve([]))
  );

  const fetchParams = createMemo(() => ({
    page: pagina(),
    limit: 10,
    orden: orden(),
    direccion: direccion(),
    buscar: busqueda(),
    provinciaId: provinciaSeleccionada() || undefined,
    localidadId: localidadSeleccionada() || undefined,
    vendedorId: vendedorIdSeleccionado() || undefined,
    soloClientesDux: soloClientesDux() || undefined,
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, (params) =>
    soloClientesDux() ? obtenerClientesDux(params) : obtenerClientes(params)
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const puedeEditar = () =>
    [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(
      usuario()?.rolUsuarioId as typeof ROLES_USUARIOS.SUPREMO | typeof ROLES_USUARIOS.ADMINISTRADOR
    );

  const exportarExcel = () => {
    const clientes = respuesta()?.data || [];
    const filas = clientes.map((c: Cliente) => ({
      Nombre: c.nombre,
      Email: c.email,
      Teléfono: c.telefono,
      Dirección: c.direccion,
      Provincia: c.provincia?.nombre,
      Localidad: c.localidad?.nombre,
      "Fecha de creación": formatearFechaCorta(c.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "clientes.xlsx");
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Clientes</h1>
        <div class="flex gap-2">
          <button
            onClick={() => setMostrarMapa(true)}
            class="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
          >
            Ver mapa de clientes
          </button>

        </div>
      </div>

      <FiltrosClientes
        usuarioRol={usuario()?.rolUsuarioId ?? 0}
        busqueda={busqueda()}
        onBuscar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        provincias={provincias() || []}
        localidades={localidades() || []}
        vendedores={vendedores() || []}
        provinciaSeleccionada={provinciaSeleccionada()}
        localidadSeleccionada={localidadSeleccionada()}
        vendedorSeleccionado={vendedorIdSeleccionado()}
        onSeleccionProvincia={(id) => {
          setProvinciaSeleccionada(id);
          setLocalidadSeleccionada("");
          setPagina(1);
        }}
        onSeleccionLocalidad={(id) => {
          setLocalidadSeleccionada(id);
          setPagina(1);
        }}
        onSeleccionVendedor={(id) => {
          setVendedorIdSeleccionado(id);
          setPagina(1);
        }}
        mostrarClientesDux={soloClientesDux()}
        onToggleClientesDux={(v) => {
          setSoloClientesDux(v);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaClientes
          clientes={respuesta()?.data ?? []}
          puedeEditar={puedeEditar()}
          mostrarClientesDux={soloClientesDux()}
          ordenActual={orden()}
          direccion={direccion()}
          onVer={setVerCliente}
          onEditar={(c) => {
            setClienteSeleccionado(c);
            setModalAbierto(true);
          }}
          onOrdenar={cambiarOrden}
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
          Página {respuesta()?.pagina ?? "-"} de{" "}
          {respuesta()?.totalPaginas ?? "-"}
        </span>
        <button
          onClick={() =>
            setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))
          }
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === (respuesta()?.totalPaginas ?? 1)}
        >
          ▶
        </button>
      </div>

      <VerClienteModal
        cliente={verCliente()}
        onCerrar={() => setVerCliente(null)}
      />

      <ModalMapaClientesDux
        abierto={mostrarMapa()}
        onCerrar={() => setMostrarMapa(false)}
      />
    </div>
  );
}
