import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show,
} from 'solid-js';
import {
  obtenerMateriasPrimas,
  obtenerMateriaPrimaPorId
} from '@/services/materiaPrima.service';
import { obtenerSubcategorias } from '@/services/categoria.service';
import { useAuth } from '@/store/auth';
import ConPermiso from '@/components/Layout/ConPermiso';
import ModalNuevaMateriaPrima from '@/components/MateriaPrima/ModalMateriaPrima';
import VerMateriaPrimaModal from '@/components/MateriaPrima/VerMateriaPrimaModal';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import Loader from '@/components/Layout/Loader';
import FiltrosMateriasPrimas from '@/components/MateriaPrima/FiltrosMateriasPrimas';
import TablaMateriasPrimas from '@/components/MateriaPrima/TablaMateriasPrimas';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import type { MateriaPrima } from '@/types/materiaPrima';

export default function MateriasPrimas() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal('sku');
  const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('asc');

  const [busqueda, setBusqueda] = createSignal('');
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = createSignal('');

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = createSignal<MateriaPrima | null>(null);
  const [verMateriaPrima, setVerMateriaPrima] = createSignal<MateriaPrima | null>(null);

  const [mensaje, setMensaje] = createSignal('');

  const { usuario } = useAuth();
  const esVendedor = usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR;

  const [categorias] = createResource(obtenerSubcategorias);

  const fetchParams = createMemo(() => ({
    page: pagina(),
    limit: 20,
    orden: orden(),
    direccion: direccion(),
    buscar: busqueda(),
    subcategoriaId: subcategoriaSeleccionada(),
  }));

  const [respuesta, { refetch }] = createResource(
    fetchParams,
    obtenerMateriasPrimas
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(col);
      setDireccion('asc');
    }
  };

  const verMateriaPrimaCompleta = async (id: number) => {
    const materiaPrima = await obtenerMateriaPrimaPorId(id);
    setVerMateriaPrima(materiaPrima);
  };

  const editarMateriaPrimaCompleta = async (id: number) => {
    const materiaPrima = await obtenerMateriaPrimaPorId(id);
    setMateriaPrimaSeleccionada(materiaPrima);
    setModalAbierto(true);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Materias Primas</h1>
      </div>

      <FiltrosMateriasPrimas
        busqueda={busqueda()}
        subcategoriaSeleccionada={subcategoriaSeleccionada()}
        subcategorias={categorias() ?? []}
        onBuscar={(valor) => {
          setBusqueda(valor);
          setPagina(1);
        }}
        onSeleccionSubcategoria={(valor) => {
          setSubcategoriaSeleccionada(valor);
          setPagina(1);
        }}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaMateriasPrimas
          materiasPrimas={respuesta()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          esVendedor={esVendedor}
          onOrdenar={cambiarOrden}
          onVer={verMateriaPrimaCompleta}
          onEditar={editarMateriaPrimaCompleta}
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

      <ModalNuevaMateriaPrima
        abierto={modalAbierto()}
        materiaPrima={materiaPrimaSeleccionada()}
        onCerrar={(mensajeExito?: string) => {
          setModalAbierto(false);
          refetch();
          if (mensajeExito) setMensaje(mensajeExito);
        }}
      />

      <VerMateriaPrimaModal
        materiaPrima={verMateriaPrima()}
        onCerrar={() => setVerMateriaPrima(null)}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
    </div>
  );
}
