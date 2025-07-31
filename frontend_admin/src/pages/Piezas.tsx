import {
    createSignal,
    createResource,
    createMemo,
    For,
    Show,
} from 'solid-js';
import {
    obtenerPiezas,
    eliminarPieza,
    obtenerPiezaPorId,
} from '@/services/pieza.service';
import { obtenerCategoriasPiezas } from '@/services/categoriaPieza.service';
import { obtenerMateriales } from '@/services/material.service';
import { obtenerRubros } from '@/services/rubro.service';
import { useAuth } from '@/store/auth';
import ModalNuevaPieza from '@/components/Pieza/ModalNuevaPieza';
import VerPiezaModal from '@/components/Pieza/VerPiezaModal';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import Loader from '@/components/Layout/Loader';
import FiltrosPiezas from '@/components/Pieza/FiltrosPiezas';
import TablaPiezas from '@/components/Pieza/TablaPiezas';
import type { Pieza } from '@/types/pieza';

export default function Piezas() {
    const [pagina, setPagina] = createSignal(1);
    const [orden, setOrden] = createSignal('codigo');
    const [direccion, setDireccion] = createSignal<'asc' | 'desc'>('asc');
    const [busqueda, setBusqueda] = createSignal('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = createSignal('');
    const [materialSeleccionado, setMaterialSeleccionado] = createSignal('');
    const [rubroSeleccionado, setRubroSeleccionado] = createSignal('');

    const [modalAbierto, setModalAbierto] = createSignal(false);
    const [piezaSeleccionada, setPiezaSeleccionada] = createSignal<Pieza | null>(null);
    const [verPieza, setVerPieza] = createSignal<Pieza | null>(null);
    const [piezaAEliminar, setPiezaAEliminar] = createSignal<Pieza | null>(null);

    const [mensaje, setMensaje] = createSignal('');
    const { usuario } = useAuth();

    const [categorias] = createResource(obtenerCategoriasPiezas);
    const [materiales] = createResource(obtenerMateriales);
    const [rubros] = createResource(obtenerRubros);

    const fetchParams = createMemo(() => ({
        page: pagina(),
        limit: 20,
        orden: orden(),
        direccion: direccion(),
        buscar: busqueda(),
        categoriaId: categoriaSeleccionada(),
        materialId: materialSeleccionado(),
        rubroId: rubroSeleccionado(),
    }));

    const [respuesta, { refetch }] = createResource(
        fetchParams,
        obtenerPiezas
    );

    const cambiarOrden = (col: string) => {
        if (orden() === col) {
            setDireccion(direccion() === 'asc' ? 'desc' : 'asc');
        } else {
            setOrden(col);
            setDireccion('asc');
        }
    };

    const verPiezaCompleta = async (id: number) => {
        const pieza = await obtenerPiezaPorId(id);
        setVerPieza(pieza);
    };

    const editarPiezaCompleta = async (id: number) => {
        const pieza = await obtenerPiezaPorId(id);
        setPiezaSeleccionada(pieza);
        setModalAbierto(true);
    };

    const handleEliminar = (id: number) => {
        setPiezaAEliminar(
            respuesta()?.data.find((p: Pieza) => p.id === id) || null
        );
    };

    return (
        <div class="p-6">
            <div class="flex justify-between items-center mb-4">
                <h1 class="text-2xl font-bold">Piezas</h1>
                <button
                    class="px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                        setPiezaSeleccionada(null);
                        setModalAbierto(true);
                    }}
                >
                    + Nueva Pieza
                </button>
            </div>

            <FiltrosPiezas
                busqueda={busqueda()}
                categoriaSeleccionada={categoriaSeleccionada()}
                categorias={categorias() ?? []}
                materialSeleccionado={materialSeleccionado()}
                materiales={materiales() ?? []}
                rubroSeleccionado={rubroSeleccionado()}
                rubros={rubros() ?? []}
                onBuscar={(valor) => {
                    setBusqueda(valor);
                    setPagina(1);
                }}
                onSeleccionCategoria={(valor) => {
                    setCategoriaSeleccionada(valor);
                    setPagina(1);
                }}
                onSeleccionMaterial={(valor) => {
                    setMaterialSeleccionado(valor);
                    setPagina(1);
                }}
                onSeleccionRubro={(valor) => {
                    setRubroSeleccionado(valor);
                    setPagina(1);
                }}
            />

            <Show when={!respuesta.loading && (respuesta()?.data?.length ?? 0) > 0} fallback={<Loader />}>
                <TablaPiezas
                    piezas={respuesta()?.data ?? []}
                    orden={orden()}
                    direccion={direccion()}
                    onOrdenar={cambiarOrden}
                    onVer={verPiezaCompleta}
                    onEditar={editarPiezaCompleta}
                    onEliminar={handleEliminar}
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

            <Show when={modalAbierto()} keyed>
                <ModalNuevaPieza
                    abierto={modalAbierto()}
                    pieza={piezaSeleccionada()}
                    onCerrar={(mensajeExito?: string) => {
                        setModalAbierto(false);
                        refetch();
                        if (mensajeExito) setMensaje(mensajeExito);
                    }}
                />
            </Show>

            <VerPiezaModal
                pieza={verPieza()}
                onCerrar={() => setVerPieza(null)}
            />

            <Show when={verPieza()}>
                <VerPiezaModal
                    pieza={verPieza()}
                    onCerrar={() => setVerPieza(null)}
                />
            </Show>

            <ModalConfirmacion
                mensaje="¿Estás seguro que querés eliminar esta pieza?"
                abierto={!!piezaAEliminar()}
                onCancelar={() => setPiezaAEliminar(null)}
                onConfirmar={async () => {
                    if (piezaAEliminar()) {
                        await eliminarPieza(piezaAEliminar()!.id);
                        setPiezaAEliminar(null);
                        refetch();
                        setMensaje('Pieza eliminada correctamente');
                    }
                }}
            />

            <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
        </div>
    );
}
