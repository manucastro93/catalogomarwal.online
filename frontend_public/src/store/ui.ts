import { createSignal } from "solid-js";

export const [productoSeleccionadoId, setProductoSeleccionado] = createSignal<number | null>(null);
