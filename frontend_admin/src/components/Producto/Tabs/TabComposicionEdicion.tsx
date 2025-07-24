import { createSignal, createResource, For, Show, onMount } from "solid-js";
import { guardarComposicionProducto } from "@/services/composicion.service";
import { obtenerConfiguracionPorClave } from "@/services/configuracionSistema.service";
import type { MateriaPrima } from "@/types/materiaPrima";
import type { ProductoComposicion } from "@/types/composicion";
import ModalAgregarPorProveedor from "@/components/Producto/ModalAgregarPorProveedor";
import { formatearPrecio } from "@/utils/formato";
import ModalMensaje from "@/components/Layout/ModalMensaje";

export default function TabComposicionEdicion(props: {
    productoId: number;
    composicionInicial?: ProductoComposicion[];
    onGuardado?: () => void;
    tiempoProduccionInicial?: number;
    incluirTiempoEnCosto: boolean;
}) {
    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = createSignal<MateriaPrima | null>(null);
    const [cantidad, setCantidad] = createSignal<string>("");
    const [composicion, setComposicion] = createSignal<
        { materiaPrima: MateriaPrima; cantidad: number; unidadMedida: string }[]
    >([]);
    const [modalAgregarPorProveedor, setModalAgregarPorProveedor] = createSignal(false);
    const [tiempoProduccion, setTiempoProduccion] = createSignal<string>("");
    const [valorHora, setValorHora] = createSignal<number>(0);
    const [mermaPorcentaje, setMermaPorcentaje] = createSignal<number>(0);
    const [incluirTiempo, setIncluirTiempo] = createSignal(true);

    onMount(async () => {
        if (props.composicionInicial?.length) {
            setComposicion(
                props.composicionInicial
                    .filter((c) => !!c.MateriaPrima)
                    .map((c) => ({
                        materiaPrima: c.MateriaPrima as MateriaPrima,
                        cantidad: c.cantidad,
                        unidadMedida: (c as any).unidadMedida || c.MateriaPrima?.unidadMedida || "UN",
                    }))
            );
        }

        if (props.tiempoProduccionInicial != null) {
            setTiempoProduccion(props.tiempoProduccionInicial.toString());
            setIncluirTiempo(props.incluirTiempoEnCosto);
        }

        const configValorHora = await obtenerConfiguracionPorClave("valor_hora");
        const configMerma = await obtenerConfiguracionPorClave("merma_global");
        setValorHora(Number(configValorHora.valor || 0));
        setMermaPorcentaje(Number(configMerma.valor || 0));
    });


    const [mostrarMensaje, setMostrarMensaje] = createSignal(false);
    const [mensaje, setMensaje] = createSignal("");

    const eliminarMateriaPrima = (index: number) => {
        setComposicion(composicion().filter((_, i) => i !== index));
    };

    const guardarComposicion = async () => {
        await guardarComposicionProducto(props.productoId, {
            composicion: composicion().map((item) => ({
                materiaPrimaId: item.materiaPrima.id,
                cantidad: item.cantidad,
                unidadMedida: item.unidadMedida,
            })),
            tiempoProduccionSegundos: Number(tiempoProduccion()),
            incluirTiempoEnCosto: incluirTiempo(),
        });
        setMensaje("Composición guardada correctamente");
        setMostrarMensaje(true);
        if (props.onGuardado) props.onGuardado();
    };

    const subtotalMateriaPrima = () => {
        return composicion().reduce((acc, item) => {
            const costoUnitario = item.materiaPrima.costoDux || 0;
            return acc + (costoUnitario * item.cantidad);
        }, 0);
    };

    const costoTiempoProduccion = () => {
        if (!incluirTiempo()) return 0;
        const segundos = Number(tiempoProduccion());
        const valorPorSegundo = valorHora() / 3600;
        return segundos * valorPorSegundo;
    };

    const costoMermaProductoFinal = () => {
        const base = subtotalMateriaPrima() + costoTiempoProduccion();
        return base * (mermaPorcentaje() / 100);
    };

    const totalComposicion = () => {
        return subtotalMateriaPrima() + costoTiempoProduccion() + costoMermaProductoFinal();
    };

    return (
        <div>
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
                            ...(Array.isArray(items) ? items : [items]),
                        ]);
                        setModalAgregarPorProveedor(false);
                    }}
                    onCerrar={() => setModalAgregarPorProveedor(false)}
                />
            </Show>

            <Show when={composicion().length > 0}>
                <div class="mt-6">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex items-center">
                            <label for="tiempoProduccion" class="text-sm text-gray-600 font-medium mr-2">
                                Tiempo de producción
                            </label>
                            <input
                                id="tiempoProduccion"
                                type="number"
                                min="0"
                                class="w-20 border rounded p-1 text-sm"
                                value={tiempoProduccion()}
                                onInput={(e) => setTiempoProduccion(e.currentTarget.value)}
                            />
                        </div>
                        <span class="text-gray-500 text-sm">segundos</span>
                        <label class="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={incluirTiempo()}
                                onChange={(e) => setIncluirTiempo(e.currentTarget.checked)}
                            />
                            Incluir en costo
                        </label>
                    </div>


                    <h3 class="font-bold mb-2 text-lg">Composición del producto:</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse rounded-lg shadow-sm">
                            <thead>
                                <tr class="bg-gray-100 text-gray-700 sticky top-0">
                                    <th class="px-3 py-2 text-left">SKU</th>
                                    <th class="px-3 py-2 text-left">Descripción</th>
                                    <th class="px-3 py-2 text-left">Proveedor</th>
                                    <th class="px-3 py-2 text-center">Cantidad</th>
                                    <th class="px-3 py-2 text-center">Unidad</th>
                                    <th class="px-3 py-2 text-center">Costo Unitario</th>
                                    <th class="px-3 py-2 text-center">Total</th>
                                    <th class="px-3 py-2 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <For each={composicion()}>
                                    {(item, i) => (
                                        <tr class="odd:bg-white even:bg-gray-50 group hover:bg-red-50 transition text-xs">
                                            <td class="px-3 py-2 font-mono">{item.materiaPrima.sku}</td>
                                            <td class="px-3 py-2">{item.materiaPrima.nombre}</td>
                                            <td class="px-3 py-2">{item.materiaPrima.Proveedor?.nombre || "-"}</td>
                                            <td class="px-3 py-2 text-center">{item.cantidad}</td>
                                            <td class="px-3 py-2 text-center">{item.unidadMedida}</td>
                                            <td class="px-3 py-2 text-center">{formatearPrecio(item.materiaPrima.costoDux)}</td>
                                            <td class="px-3 py-2 text-center">
                                                {formatearPrecio((item.materiaPrima.costoDux || 0) * item.cantidad)}
                                            </td>
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
                            <tfoot>
                                <tr class="font-bold bg-gray-100 text-sm">
                                    <td colspan="6" class="text-right pr-4">Subtotal materia prima:</td>
                                    <td class="text-center">{formatearPrecio(subtotalMateriaPrima())}</td>
                                    <td></td>
                                </tr>
                                <tr class="font-bold bg-gray-50 text-sm">
                                    <td colspan="6" class="text-right pr-4">Costo tiempo producción:</td>
                                    <td class="text-center">{formatearPrecio(costoTiempoProduccion())}</td>
                                    <td></td>
                                </tr>
                                <tr class="font-bold bg-gray-100 text-sm">
                                    <td colspan="6" class="text-right pr-4">
                                        Merma sobre producto final ({mermaPorcentaje()}%):
                                    </td>
                                    <td class="text-center">{formatearPrecio(costoMermaProductoFinal())}</td>
                                    <td></td>
                                </tr>
                                <tr class="font-bold bg-gray-200 text-sm">
                                    <td colspan="6" class="text-right pr-4">Total composición final:</td>
                                    <td class="text-center">{formatearPrecio(totalComposicion())}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </Show>
            
            <div class="text-right mt-4 flex gap-2 justify-end">
                <button
                    class="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                    onClick={guardarComposicion}
                >
                    Guardar composición
                </button>
            </div>
            
            <Show when={mostrarMensaje()}>
                <ModalMensaje mensaje={mensaje()} cerrar={() => setMostrarMensaje(false)} />
            </Show>
        </div>
    );
}