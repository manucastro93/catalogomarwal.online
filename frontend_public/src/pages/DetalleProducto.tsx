import { createSignal, onMount, Show } from "solid-js";
import { obtenerProductoPorId } from "../services/producto.service";
import { agregarAlCarrito, setCarritoAbierto } from "../store/carrito";
import { registrarLogCliente } from "../services/cliente.service";

export default function DetalleProductoInline(props: { id: number }) {
  const [producto, setProducto] = createSignal<any>(null);
  const [cantidad, setCantidad] = createSignal(1);

  onMount(async () => {
    const prod = await obtenerProductoPorId(props.id);
    setProducto(prod);

    registrarLogCliente({
      ubicacion: "detalle_producto",
      clienteId: Number(localStorage.getItem("clienteId")) || undefined,
      sesion: localStorage.getItem("sesionId") || crypto.randomUUID(),
      referer: document.referrer,
    });
  });

  const handleAgregar = () => {
    const p = producto();
    if (!p) return;

    agregarAlCarrito({
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precioPorBulto),
      imagen: p.Imagenes?.[0]?.url || "/placeholder.png",
      precioPorBulto: Number(p.precioPorBulto),
      unidadPorBulto: p.unidadPorBulto,
    });

    setCarritoAbierto(true);
  };

  return (
    <Show when={producto()}>
      <div class="p-4 mt-6 border-t">
        <div class="flex flex-col sm:flex-row gap-6">
          <img
            src={`${import.meta.env.VITE_UPLOADS_URL}${producto()?.Imagenes?.[0]?.url}`}
            alt="Producto"
            class="w-full sm:w-1/2 object-contain bg-white max-h-96"
          />

          <div class="flex-1">
            <h2 class="text-xl font-bold mb-2">{producto().nombre}</h2>
            <p class="text-green-700 text-lg">
              ${producto().precioPorBulto?.toFixed(2)} x bulto
            </p>
            <p class="text-sm text-gray-500">
              (Equivale a ${(producto().precioPorBulto / producto().unidadPorBulto).toFixed(2)} por unidad)
            </p>

            <p class="mt-4 text-sm text-gray-700">{producto().descripcion}</p>

            <div class="mt-4 flex items-center gap-2">
              <label class="text-sm">Cantidad (bultos):</label>
              <input
                type="number"
                min="1"
                value={cantidad()}
                onInput={(e) => setCantidad(+e.currentTarget.value)}
                class="border px-2 py-1 w-20 rounded"
              />
              <span class="text-sm text-gray-600">
                ({cantidad() * (producto().unidadPorBulto || 1)} unidades)
              </span>
            </div>

            <button
              class="mt-4 bg-black text-white px-4 py-2 rounded"
              onClick={handleAgregar}
            >
              Agregar al carrito 🛒
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
