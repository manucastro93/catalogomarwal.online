import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { obtenerMateriasPrimas } from "@/services/materiaPrima.service";
import { obtenerSubcategorias } from "@/services/categoria.service";
import { guardarComposicionProducto } from "@/services/composicion.service";
import type { MateriaPrima } from "@/types/materiaPrima";
import type { ProductoComposicion } from "@/types/composicion";

export default function TabComposicionEdicion(props: {
    productoId: number;
    composicionInicial?: ProductoComposicion[];
    onGuardado?: () => void;
}) {
    // Estado de filtros y búsqueda
    const [subcategoriaId, setSubcategoriaId] = createSignal<string>("");
    const [busqueda, setBusqueda] = createSignal<string>("");
    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = createSignal<MateriaPrima | null>(null);
    const [cantidad, setCantidad] = createSignal<string>("");

    // Estado de la composición
    const [composicion, setComposicion] = createSignal<
        { materiaPrima: MateriaPrima; cantidad: number }[]
    >([]);

    // Subcategorías para filtro
    const [subcategorias] = createResource(obtenerSubcategorias);

    // Materias primas encontradas (filtrado)
    const [resultadosBusqueda] = createResource(
        () => ({
            subcategoriaId: subcategoriaId() || undefined,
            buscar: busqueda() || undefined,
        }),
        obtenerMateriasPrimas
    );

    // Cargar composición inicial si existe
    onMount(() => {
        if (props.composicionInicial?.length) {
            setComposicion(
                props.composicionInicial
                    .filter((c) => !!c.MateriaPrima)
                    .map((c) => ({
                        materiaPrima: c.MateriaPrima as MateriaPrima,
                        cantidad: c.cantidad,
                    }))
            );

        }
    });



    // Handler: agregar materia prima a composición
    const agregarMateriaPrima = () => {
        if (!materiaPrimaSeleccionada() || !cantidad()) return;
        setComposicion([
            ...composicion(),
            { materiaPrima: materiaPrimaSeleccionada()!, cantidad: Number(cantidad()) },
        ]);
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setBusqueda("");
    };

    // Handler: quitar una materia prima
    const eliminarMateriaPrima = (index: number) => {
        setComposicion(composicion().filter((_, i) => i !== index));
    };

    // Handler: guardar composición en backend
    const guardarComposicion = async () => {
        await guardarComposicionProducto(
            props.productoId,
            composicion().map((item) => ({
                materiaPrimaId: item.materiaPrima.id,
                cantidad: item.cantidad,
            }))
        );
        if (props.onGuardado) props.onGuardado();
    };

    return (
        <div>
            {/* 1. Filtro por subcategoría */}
            <label class="font-medium">Filtrar por categoría:</label>
            <select
                value={subcategoriaId()}
                onInput={(e) => setSubcategoriaId(e.currentTarget.value)}
                class="border p-1 rounded mb-2 w-full"
            >
                <option value="">Todas</option>
                <For each={subcategorias() ?? []}>
                    {(cat) => <option value={cat.id}>{cat.nombre}</option>}
                </For>
            </select>

            {/* 2. Buscador */}
            <label class="font-medium">Buscar materia prima:</label>
            <input
                type="text"
                class="border p-1 rounded w-full mb-2"
                placeholder="Buscar por nombre o SKU"
                value={busqueda()}
                onInput={(e) => setBusqueda(e.currentTarget.value)}
                autocomplete="off"
            />

            {/* 3. Resultados autocompletado */}
            <Show when={busqueda().length >= 2 && resultadosBusqueda()}>
                <div class="border rounded bg-white max-h-48 overflow-y-auto z-10 relative">
                    <For each={resultadosBusqueda()?.data ?? []}>
                        {(mp) => (
                            <div
                                class="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    setMateriaPrimaSeleccionada(mp);
                                    setBusqueda(`${mp.sku} - ${mp.nombre}`);
                                }}
                            >
                                {mp.sku} - {mp.nombre}
                            </div>
                        )}
                    </For>
                </div>
            </Show>

            {/* 4. Si seleccionó una materia prima, muestro unidad y cantidad */}
            <Show when={materiaPrimaSeleccionada()}>
                <div class="mt-3 border p-2 rounded bg-gray-50">
                    <div>
                        <strong>{materiaPrimaSeleccionada()!.nombre}</strong> | Unidad: <b>{materiaPrimaSeleccionada()!.unidadMedida}</b>
                    </div>
                    <div class="mt-2 flex gap-2 items-center">
                        <input
                            class="border p-1 rounded w-32"
                            type="number"
                            min="0"
                            placeholder="Cantidad"
                            value={cantidad()}
                            onInput={(e) => setCantidad(e.currentTarget.value)}
                        />
                        <button
                            class="bg-blue-500 text-white px-2 py-1 rounded"
                            onClick={agregarMateriaPrima}
                        >
                            Agregar
                        </button>
                        <button
                            class="bg-gray-300 px-2 py-1 rounded ml-2"
                            onClick={() => setMateriaPrimaSeleccionada(null)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Show>

            {/* 5. Listado de composición actual */}
            <Show when={composicion().length > 0}>
                <div class="mt-6">
                    <h3 class="font-bold mb-2">Composición del producto:</h3>
                    <For each={composicion()}>
                        {(item, i) => (
                            <div class="flex items-center gap-2 mb-1">
                                <span>
                                    {item.materiaPrima.sku} - {item.materiaPrima.nombre} ({item.cantidad} {item.materiaPrima.unidadMedida})
                                </span>
                                <button
                                    class="ml-2 text-red-500 hover:underline"
                                    onClick={() => eliminarMateriaPrima(i())}
                                >
                                    Quitar
                                </button>
                            </div>
                        )}
                    </For>
                </div>
                <div class="text-right mt-4">
                    <button
                        class="bg-green-600 text-white px-4 py-1 rounded"
                        onClick={guardarComposicion}
                    >
                        Guardar composición
                    </button>
                </div>
            </Show>
        </div>
    );
}
