import {
  createSignal,
  createResource,
  createEffect,
  createMemo,
  For,
  Show,
} from 'solid-js';
import {
  obtenerVendedores,
  agregarVendedor,
  editarVendedor,
  eliminarVendedor,
} from '../services/vendedor.service';
import ModalNuevoVendedor from '../components/ModalNuevoVendedor';
import VerVendedorModal from '../components/VerVendedorModal';
import type { Vendedor } from '../shared/types/vendedor';
import ModalMensaje from '../components/ModalMensaje';
import ModalConfirmacion from '../components/ModalConfirmacion';

export default function Vendedores() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal('createdAt');
  const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('desc');

  const [busqueda, setBusqueda] = createSignal('');
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [vendedorSeleccionado, setVendedorSeleccionado] = createSignal<Vendedor | null>(null);
  const [verVendedor, setVerVendedor] = createSignal<Vendedor | null>(null);

  const [modalMensaje, setModalMensaje] = createSignal('');
  const [modalConfirmar, setModalConfirmar] = createSignal(false);
  const [idAEliminar, setIdAEliminar] = createSignal<string | null>(null);

  const [respuesta, { refetch }] = createResource(obtenerVendedores);

  const vendedoresFiltrados = createMemo(() => {
    const buscar = busqueda().toLowerCase();
    return respuesta()?.filter((v) =>
      v.nombre?.toLowerCase().includes(buscar) ||
      v.email?.toLowerCase().includes(buscar) ||
      v.telefono?.includes(buscar)
    ) || [];
  });

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(col);
      setDireccion('asc');
    }
  };

  const confirmarEliminar = (id: string) => {
    setIdAEliminar(id);
    setModalConfirmar(true);
  };

  const handleEliminar = async () => {
    if (!idAEliminar()) return;
    await eliminarVendedor(idAEliminar()!);
    setModalMensaje('Vendedor eliminado correctamente');
    refetch();
  };

  const verDetalle = (v: Vendedor) => {
    setVerVendedor(v);
  };

  const editarVendedorCompleto = (v: Vendedor) => {
    setVendedorSeleccionado(v);
    setModalAbierto(true);
  };

  const nuevoVendedor = () => {
    setVendedorSeleccionado(null);
    setModalAbierto(true);
  };

  const handleGuardarVendedor = async (datos: Partial<Vendedor>) => {
    if (vendedorSeleccionado()) {
      await editarVendedor(vendedorSeleccionado()!.id, datos);
      setModalMensaje('Vendedor editado correctamente');
    } else {
      await agregarVendedor(datos);
      setModalMensaje('Vendedor creado correctamente');
    }
    refetch();
    setModalAbierto(false);
    setVendedorSeleccionado(null);
  };

  const copiarLink = async (id: string) => {
    try {
      const link = `https://www.catalogomarwal.online/${id}`;
      await navigator.clipboard.writeText(link);
      setModalMensaje('¡Link copiado al portapapeles!');
    } catch (err) {
      setModalMensaje('Error al copiar el link');
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Vendedores</h1>
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            class="p-2 border rounded"
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />
          <button
            onClick={nuevoVendedor}
            class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            + Nuevo Vendedor
          </button>
        </div>
      </div>

      <div class="overflow-auto border rounded-lg">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-gray-100">
            <tr>
              <th class="text-left p-3 cursor-pointer" onClick={() => cambiarOrden('nombre')}>
                Nombre {orden() === 'nombre' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 cursor-pointer" onClick={() => cambiarOrden('email')}>
                Email {orden() === 'email' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3 cursor-pointer" onClick={() => cambiarOrden('telefono')}>
                Teléfono {orden() === 'telefono' && (direccion() === 'asc' ? '▲' : '▼')}
              </th>
              <th class="text-left p-3">Link</th>
              <th class="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <Show
              when={vendedoresFiltrados().length > 0}
              fallback={
                <tr>
                  <td colSpan={5} class="p-4 text-center text-gray-500">
                    No se encontraron vendedores
                  </td>
                </tr>
              }
            >
              <For each={vendedoresFiltrados()}>
                {(v) => (
                  <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">{v.nombre}</td>
                    <td class="p-3">{v.email}</td>
                    <td class="p-3">{v.telefono || '-'}</td>
                    <td class="p-3">
                      <button
                        class="text-blue-600 hover:underline"
                        onClick={() => copiarLink(v.link)}
                      >
                        Copiar link
                      </button>
                    </td>
                    <td class="p-3 flex gap-2">
                      <button class="text-blue-600 hover:underline" onClick={() => verDetalle(v)}>
                        Ver
                      </button>
                      <button class="text-green-600 hover:underline" onClick={() => editarVendedorCompleto(v)}>
                        Editar
                      </button>
                      <button class="text-red-600 hover:underline" onClick={() => confirmarEliminar(v.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      <ModalNuevoVendedor
        abierto={modalAbierto()}
        cerrar={() => {
          setModalAbierto(false);
          setVendedorSeleccionado(null);
        }}
        vendedor={vendedorSeleccionado()}
        onGuardar={handleGuardarVendedor}
      />

      <VerVendedorModal
        vendedor={verVendedor()}
        abierto={verVendedor() !== null && !modalAbierto()}
        onCerrar={() => setVerVendedor(null)}
      />

      <ModalConfirmacion
        abierto={modalConfirmar()}
        onCancelar={() => setModalConfirmar(false)}
        onConfirmar={() => {
          setModalConfirmar(false);
          handleEliminar();
        }}
        mensaje="¿Estás seguro que querés eliminar este vendedor?"
      />

      <ModalMensaje mensaje={modalMensaje()} cerrar={() => setModalMensaje('')} />
    </div>
  );
}
