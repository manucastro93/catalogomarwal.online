import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show,
} from 'solid-js';
import {
  obtenerProductos,
  obtenerProductoPorId,
} from '@/services/producto.service';
import { obtenerCategorias } from '@/services/categoria.service';
import { useAuth } from '@/store/auth';
import ConPermiso from '@/components/Layout/ConPermiso';
import VerProductoModal from '@/components/Producto/Stock/VerProductoModal';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import Loader from '@/components/Layout/Loader';
import FiltrosProductos from '@/components/Producto/FiltrosProductos';
import TablaProductos from '@/components/Producto/Stock/TablaProductos';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { Producto } from '@/types/producto';

export default function Productos() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal('sku');
  const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('asc');

  const [busqueda, setBusqueda] = createSignal('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = createSignal('');

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [productoSeleccionado, setProductoSeleccionado] = createSignal<Producto | null>(null);
  const [verProducto, setVerProducto] = createSignal<Producto | null>(null);

  const [mensaje, setMensaje] = createSignal('');

  const { usuario } = useAuth();
  const esVendedor = usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR;

  const [categorias] = createResource(obtenerCategorias);

  const fetchParams = createMemo(() => ({
    page: pagina(),
    limit: 20,
    orden: orden(),
    direccion: direccion(),
    buscar: busqueda(),
    categoriaId: categoriaSeleccionada(),
  }));

  const [respuesta, { refetch }] = createResource(
    fetchParams,
    obtenerProductos
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(col);
      setDireccion('asc');
    }
  };

  const verProductoCompleto = async (id: number) => {
    const producto = await obtenerProductoPorId(id);
    setVerProducto(producto);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Productos</h1>
        {!esVendedor && (
          <div class="flex gap-2">
          </div>
        )}
      </div>

      <FiltrosProductos
        busqueda={busqueda()}
        categoriaSeleccionada={categoriaSeleccionada()}
        categorias={categorias() ?? []}
        onBuscar={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        onSeleccionCategoria={(valor) => {
          setCategoriaSeleccionada(valor);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaProductos
          productos={respuesta()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          esVendedor={esVendedor}
          onOrdenar={cambiarOrden}
          onVer={verProductoCompleto}
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
          Página {respuesta()?.pagina ?? '-'} de {respuesta()?.totalPaginas ?? '-'}
        </span>
        <button
          onClick={() => setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === (respuesta()?.totalPaginas ?? 1)}
        >
          ▶
        </button>
      </div>
      
      <VerProductoModal
        producto={verProducto()}
        onCerrar={() => setVerProducto(null)}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
    </div>
  );
}
