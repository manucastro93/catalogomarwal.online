import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { guardarComposicionProducto } from "@/services/composicion.service";
import type { MateriaPrima } from "@/types/materiaPrima";
import type { ProductoComposicion } from "@/types/composicion";
import ModalAgregarPorProveedor from "@/components/Producto/ModalAgregarPorProveedor";

export default function TabComposicionEdicion(props: {
    productoId: number;
    composicionInicial?: ProductoComposicion[];
    onGuardado?: () => void;
}) {
    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = createSignal<MateriaPrima | null>(null);
    const [cantidad, setCantidad] = createSignal<string>("");
    // AHORA incluye unidadMedida
    const [composicion, setComposicion] = createSignal<
      { materiaPrima: MateriaPrima; cantidad: number; unidadMedida: string }[]
    >([]);
    const [modalAgregarPorProveedor, setModalAgregarPorProveedor] = createSignal(false);

    onMount(() => {
        if (props.composicionInicial?.length) {
            setComposicion(
                props.composicionInicial
                    .filter((c) => !!c.MateriaPrima)
                    .map((c) => ({
                        materiaPrima: c.MateriaPrima as MateriaPrima,
                        cantidad: c.cantidad,
                        // Si tu modelo original no trae unidad, usá la que trae la materia prima o "UN" por defecto
                        unidadMedida: (c as any).unidadMedida || c.MateriaPrima?.unidadMedida || "UN",
                    }))
            );
        }
    });

    // Handler: agregar materia prima individual (opcional)
    const agregarMateriaPrima = () => {
        if (!materiaPrimaSeleccionada() || !cantidad()) return;
        setComposicion([
            ...composicion(),
            { materiaPrima: materiaPrimaSeleccionada()!, cantidad: Number(cantidad()), unidadMedida: materiaPrimaSeleccionada()!.unidadMedida || "UN" },
        ]);
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
    };

    const eliminarMateriaPrima = (index: number) => {
        setComposicion(composicion().filter((_, i) => i !== index));
    };

    // IMPORTANTE: ahora mandamos unidadMedida también al backend
    const guardarComposicion = async () => {
        await guardarComposicionProducto(
            props.productoId,
            composicion().map((item) => ({
                materiaPrimaId: item.materiaPrima.id,
                cantidad: item.cantidad,
                unidadMedida: item.unidadMedida, // <-- agregá esto
            }))
        );
        if (props.onGuardado) props.onGuardado();
    };

    return (
        <div>
            {/* Botón para agregar por proveedor */}
            <button
                class="bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 mb-2"
                onClick={() => setModalAgregarPorProveedor(true)}
            >
                <span class="text-lg font-bold">+</span> Agregar por proveedor
            </button>

            <Show when={modalAgregarPorProveedor()}>
                <ModalAgregarPorProveedor
                    onAgregar={(items) => {
                        setComposicion([
                            ...composicion(),
                            ...(Array.isArray(items) ? items : [items]), // Asegura que siempre sea array
                        ]);
                        setModalAgregarPorProveedor(false);
                        }}
                    onCerrar={() => setModalAgregarPorProveedor(false)}
                />
            </Show>

            {/* Listado de composición actual */}
            <Show when={composicion().length > 0}>
                <div class="mt-6">
                    <h3 class="font-bold mb-2">Composición del producto:</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse rounded-lg shadow-sm">
                            <thead>
                                <tr class="bg-gray-100 text-gray-700 text-sm sticky top-0">
                                    <th class="px-3 py-2 text-left">SKU</th>
                                    <th class="px-3 py-2 text-left">Descripción</th>
                                    <th class="px-3 py-2 text-center">Cantidad</th>
                                    <th class="px-3 py-2 text-center">Unidad</th>
                                    <th class="px-3 py-2 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={composicion()}>
                                    {(item, i) => (
                                        <tr class="odd:bg-white even:bg-gray-50 group hover:bg-red-50 transition text-xs">
                                            <td class="px-3 py-2 font-mono">{item.materiaPrima.sku}</td>
                                            <td class="px-3 py-2">{item.materiaPrima.nombre}</td>
                                            <td class="px-3 py-2 text-center">{item.cantidad}</td>
                                            <td class="px-3 py-2 text-center">{item.unidadMedida}</td>
                                            <td class="px-3 py-2 text-center">
                                                <button
                                                    class="text-red-600 font-semibold opacity-70 hover:opacity-100 transition group-hover:underline group-hover:opacity-100"
                                                    onClick={() => eliminarMateriaPrima(i())}
                                                    title="Quitar"
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="text-right mt-4 flex gap-2 justify-end">
                    <button
                        class="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                        onClick={guardarComposicion}
                    >
                        Guardar composición
                    </button>
                    <button
                        class="bg-gray-200 text-gray-800 px-4 py-1 rounded hover:bg-gray-300 transition"
                        onClick={props.onGuardado}
                    >
                        Cancelar
                    </button>
                </div>
            </Show>
        </div>
    );
}
