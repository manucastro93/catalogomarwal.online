import { createSignal, createResource, createMemo, Show } from 'solid-js';
import * as XLSX from 'xlsx';
import { obtenerProveedores } from '@/services/proveedor.service';
import { obtenerProvincias, obtenerLocalidades } from '@/services/ubicacion.service';
import { useAuth } from '@/store/auth';
import VerProveedorModal from '@/components/Proveedor/VerProveedorModal';
import TablaProveedores from '@/components/Proveedor/TablaProveedores';
import FiltrosProveedores from '@/components/Proveedor/FiltrosProveedores';
import Loader from '@/components/Layout/Loader';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { Proveedor } from '@/types/proveedor';
import { formatearFechaCorta } from '@/utils/formato';

export default function Proveedores() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("createdAt");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [busqueda, setBusqueda] = createSignal("");
  const [provinciaSeleccionada, setProvinciaSeleccionada] = createSignal<number | "">("");
  const [localidadSeleccionada, setLocalidadSeleccionada] = createSignal<number | "">("");

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [verProveedor, setVerProveedor] = createSignal<Proveedor | null>(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = createSignal<Proveedor | null>(null);

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
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerProveedores);

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
    const proveedores = respuesta()?.data || [];
    const filas = proveedores.map((p: Proveedor) => ({
      Nombre: p.nombre,
      "Tipo Doc": p.tipoDoc,
      "Nro Doc": p.nroDoc,
      Email: p.email,
      Teléfono: p.telefono,
      Provincia: p.provincia,
      Localidad: p.localidad,
      "Dirección": p.domicilio,
      "Fecha de creación": formatearFechaCorta(p.createdAt),
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
    XLSX.writeFile(wb, "proveedores.xlsx");
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Proveedores</h1>
        <div class="flex gap-2">
          <button
            onClick={exportarExcel}
            class="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
          >
            Exportar a Excel
          </button>
        </div>
      </div>

      <FiltrosProveedores
        usuarioRol={usuario()?.rolUsuarioId ?? 0}
        busqueda={busqueda()}
        onBuscar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        provincias={provincias() || []}
        localidades={localidades() || []}
        provinciaSeleccionada={provinciaSeleccionada()}
        localidadSeleccionada={localidadSeleccionada()}
        onSeleccionProvincia={(id) => {
          setProvinciaSeleccionada(id);
          setLocalidadSeleccionada("");
          setPagina(1);
        }}
        onSeleccionLocalidad={(id) => {
          setLocalidadSeleccionada(id);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaProveedores
          proveedores={respuesta()?.data ?? []}
          puedeEditar={puedeEditar()}
          onVer={setVerProveedor}
          onEditar={(p) => {
            setProveedorSeleccionado(p);
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

      <VerProveedorModal
        proveedor={verProveedor()}
        onCerrar={() => setVerProveedor(null)}
      />
    </div>
  );
}
