// 🔵 SolidJS imports
import { createSignal, Show } from "solid-js";
// 🗂️ Store
import { agregarAlCarrito, setCarritoAbierto } from "@/store/carrito";
// 📋 Types
import type { Producto } from "@/types/producto";
// 🛠️ Utils
import { formatearPrecio } from "@/utils/formato";
import { animarHaciaCarrito } from "@/utils/animarHaciaCarrito";
import { esMobile } from "@/utils/esMobile";


interface Props {
  producto: Producto;
  onVolver: () => void;
  onSeleccionarCategoria?: (categoria: string) => void;
}

export default function DetalleProductoInline({ producto, onVolver, onSeleccionarCategoria }: Props) {
  const [cantidad, setCantidad] = createSignal(1);
  const [imagenActual, setImagenActual] = createSignal(0);

  const cambiarImagen = (delta: number) => {
    const imagenes = producto.Imagenes || [];
    const nueva = imagenActual() + delta;
    if (nueva >= 0 && nueva < imagenes.length) {
      setImagenActual(nueva);
    }
  };

  const handleAgregar = () => {
    if (!producto.nombre) return;
  
    if (esMobile()) {
      const imagenEl = document.querySelector("#detalle-producto-img") as HTMLImageElement;
      if (imagenEl) {
        animarHaciaCarrito(imagenEl);
      }
    }
  
    agregarAlCarrito({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      imagen: producto.Imagenes?.[0]?.url || '/placeholder.png',
      unidadPorBulto: producto.unidadPorBulto || 1,
      precioPorBulto: (Number(producto.precio) || 0) * (producto.unidadPorBulto || 1),
    }, false);
  
    if (window.innerWidth >= 768) {
      setCarritoAbierto(true); // solo en desktop
    }
  };

  return (
    <Show when={producto}>
      <div class="grid sm:grid-cols-2 gap-6 mt-8 mb-12 bg-white p-4">
        {/* Imágenes */}
        <div class="relative w-full h-115 bg-white border rounded flex items-center justify-center">
          <img
            id="detalle-producto-img"
            src={`${import.meta.env.VITE_UPLOADS_URL}${producto.Imagenes?.[imagenActual()]?.url}`}
            alt={`Imagen ${imagenActual() + 1}`}
            class="max-h-full max-w-full object-contain"
          />
          <button
            onClick={() => cambiarImagen(-1)}
            disabled={imagenActual() === 0}
            class="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow px-2 py-1"
          >‹</button>
          <button
            onClick={() => cambiarImagen(1)}
            disabled={imagenActual() === (producto.Imagenes?.length || 0) - 1}
            class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow px-2 py-1"
          >›</button>
        </div>

        {/* Info */}
        <div>
          <h1 class="text-2xl font-bold mb-2">{producto.nombre || 'Sin nombre'}</h1>
          <p class="text-xl text-black font-semibold">
            {formatearPrecio(Number(producto.precioPorBulto || 0))} x bulto
          </p>
          <p class="text-sm text-gray-500 mb-2">
            (Equivale a {formatearPrecio(producto.precio)} por unidad)
          </p>

          {producto.descripcion && (
            <p class="mb-4 text-gray-700 text-sm">{producto.descripcion}</p>
          )}

{producto.Categoria?.nombre && (
  <button
    class="text-sm text-blue-600 underline mb-4 block"
    onClick={() =>
      location.assign(`/?categoria=${encodeURIComponent(producto.Categoria?.nombre || '')}`)
    }
  >
    Ver más productos de la categoría "{producto.Categoria.nombre}"
  </button>
)}


          <div class="flex items-center gap-2 mb-4">
            <label for="cantidad" class="text-sm font-medium">
              Cantidad (en bultos):
            </label>
            <input
              id="cantidad"
              type="number"
              min="1"
              class="border rounded px-2 py-1 w-20"
              value={cantidad()}
              onInput={(e) => setCantidad(parseInt(e.currentTarget.value))}
            />
            <span class="text-sm text-gray-600">
              ({cantidad() * (producto.unidadPorBulto || 1)} unidades)
            </span>
          </div>

          <div class="flex gap-2">
            <button
              onClick={handleAgregar}
              class="bg-black text-white px-4 py-2 rounded hover:opacity-90"
            >
              🛒 Agregar al carrito
            </button>

            <button
              onClick={onVolver}
              class="text-sm px-4 py-2 border border-gray-400 rounded hover:bg-gray-100"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
