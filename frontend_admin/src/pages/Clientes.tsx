// src/pages/Clientes.tsx
import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show,
  createEffect
} from 'solid-js';
import * as XLSX from 'xlsx';
import { obtenerClientes, eliminarCliente } from '../services/cliente.service';
import { obtenerProvincias, obtenerLocalidades } from '../services/ubicacion.service';
import { useAuth } from '../store/auth';
import type { Cliente } from '../shared/types/cliente';
import type { Provincia, Localidad } from '../shared/types/ubicacion';
import ModalConfirmacion from '../components/ModalConfirmacion';
import ModalCliente from '../components/ModalCliente';
import VerClienteModal from '../components/VerClienteModal';
import { obtenerVendedores } from '../services/vendedor.service';

export default function Clientes() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal('createdAt');
  const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('desc');

  const [busqueda, setBusqueda] = createSignal('');
  const [provinciaSeleccionada, setProvinciaSeleccionada] = createSignal<number | ''>('');
  const [localidadSeleccionada, setLocalidadSeleccionada] = createSignal<number | ''>('');
  const [vendedorIdSeleccionado, setVendedorIdSeleccionado] = createSignal<number | ''>('');

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [verCliente, setVerCliente] = createSignal<Cliente | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = createSignal<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = createSignal<Cliente | null>(null);
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [vendedores] = createResource(obtenerVendedores);
  const [provincias] = createResource(obtenerProvincias);
  const [localidades] = createResource(
    () => provinciaSeleccionada(),
    (id) => id ? obtenerLocalidades(Number(id)) : Promise.resolve([])
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
      'Fecha de creación': new Date(c.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'clientes.xlsx');
  };

  const fetchParams = createMemo(() => ({
    page: pagina(),
    limit: 10,
    orden: orden(),
    direccion: direccion(),
    buscar: busqueda(),
    provinciaId: provinciaSeleccionada() || undefined,
    localidadId: localidadSeleccionada() || undefined,
    vendedorId: vendedorIdSeleccionado() || undefined, 
  }));

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerClientes);

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(col);
      setDireccion('asc');
    }
  };

  const puedeEditar = () => ['supremo', 'administrador'].includes(usuario()?.rol || '');
  const puedeEliminar = () => usuario()?.rol === 'supremo';
  const puedeAgregar = () => ['supremo', 'vendedor'].includes(usuario()?.rol || '');

  const confirmarEliminacion = async () => {
    if (!clienteAEliminar()) return;
    await eliminarCliente(clienteAEliminar()!.id);
    setClienteAEliminar(null);
    setModalConfirmar(false);
    refetch();
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Clientes</h1>
        <Show when={puedeAgregar()}>
          <div class="flex gap-2">
            <button
              onClick={exportarExcel}
              class="bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Exportar Excel
            </button>
            <button
              onClick={() => {
                setClienteSeleccionado(null);
                setModalAbierto(true);
              }}
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              + Nuevo Cliente
            </button>
          </div>
        </Show>
      </div>

      <div class="flex gap-4 mb-4 flex-wrap">
        <Show when={usuario()?.rol !== 'vendedor'}>
          <select
            class="p-2 border rounded"
            value={vendedorIdSeleccionado()}
            onInput={(e) => {
              setVendedorIdSeleccionado(Number(e.currentTarget.value) || '');
              setPagina(1);
            }}
          >
            <option value="">Todos los vendedores</option>
            <For each={vendedores()}>{(v) => (
              <option value={v.id}>{v.nombre}</option>
            )}</For>
          </select>
        </Show>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          class="p-2 border rounded w-full max-w-xs"
          value={busqueda()}
          onInput={(e) => {
            setBusqueda(e.currentTarget.value);
            setPagina(1);
          }}
        />

        <select
          class="p-2 border rounded"
          value={provinciaSeleccionada()}
          onInput={(e) => {
            setProvinciaSeleccionada(Number(e.currentTarget.value) || '');
            setLocalidadSeleccionada('');
            setPagina(1);
          }}
        >
          <option value="">Todas las provincias</option>
          <For each={provincias()}>{(p) => <option value={p.id}>{p.nombre}</option>}</For>
        </select>

        <select
          class="p-2 border rounded"
          value={localidadSeleccionada()}
          onInput={(e) => {
            setLocalidadSeleccionada(Number(e.currentTarget.value) || '');
            setPagina(1);
          }}
        >
          <option value="">Todas las localidades</option>
          <For each={localidades()}>{(l) => <option value={l.id}>{l.nombre}</option>}</For>
        </select>
      </div>

      <div class="overflow-auto border rounded-lg">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-100 sticky top-0">
            <tr>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('nombre')}>Nombre</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('email')}>Email</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('provincia')}>Provincia</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('localidad')}>Localidad</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('vendedor')}>Vendedor</th>
              <th class="text-left p-3 border-b cursor-pointer" onClick={() => cambiarOrden('createdAt')}>Creado</th>
              <th class="text-left p-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <Show when={respuesta()?.data?.length > 0} fallback={<tr><td colspan="6" class="text-center p-4 text-gray-500">No se encontraron clientes</td></tr>}>
              <For each={respuesta()?.data}>
                {(c: Cliente) => (
                  <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3">{c.nombre}</td>
                    <td class="p-3">{c.email}</td>
                    <td class="p-3">{c.provincia?.nombre}</td>
                    <td class="p-3">{c.localidad?.nombre}</td>
                    <td class="p-3">{c.vendedor?.nombre}</td>
                    <td class="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td class="p-3 flex gap-2">
                      <button class="text-blue-600 hover:underline" onClick={() => setVerCliente(c)}>Ver</button>
                      <Show when={puedeEditar()}>
                        <button class="text-green-600 hover:underline" onClick={() => {
                          setClienteSeleccionado(c);
                          setModalAbierto(true);
                        }}>Editar</button>
                      </Show>
                      <Show when={puedeEliminar()}>
                        <button class="text-red-600 hover:underline" onClick={() => {
                          setClienteAEliminar(c);
                          setModalConfirmar(true);
                        }}>Eliminar</button>
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
          onClick={() => setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === respuesta()?.totalPaginas}
        >
          ▶
        </button>
      </div>

      <ModalCliente
        abierto={modalAbierto()}
        cliente={clienteSeleccionado()}
        onClose={() => {
          setModalAbierto(false);
          refetch();
        }}
      />

      <VerClienteModal
        cliente={verCliente()}
        onCerrar={() => setVerCliente(null)}
      />

      <ModalConfirmacion
        abierto={modalConfirmar()}
        mensaje={`¿Estás seguro que querés eliminar al cliente "${clienteAEliminar()?.nombre}"?`}
        onCancelar={() => {
          setClienteAEliminar(null);
          setModalConfirmar(false);
        }}
        onConfirmar={confirmarEliminacion}
      />
    </div>
  );
}
