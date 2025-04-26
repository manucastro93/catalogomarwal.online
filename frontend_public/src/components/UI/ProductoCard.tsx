// 🔵 SolidJS imports
import { createSignal } from "solid-js";
// 🗂️ Store
import { agregarAlCarrito, setCarritoAbierto } from "@/store/carrito";
// 🛠️ Utils
import { formatearPrecio } from "@/utils/formato";
import { animarHaciaCarrito } from "@/utils/animarHaciaCarrito";
import { esMobile } from "@/utils/esMobile";

interface Props {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  imagen: string;
  segundaImagen?: string;
  precioPorBulto?: number;
  unidadPorBulto?: number;
  onVerDetalle?: () => void;
}

export default function ProductoCard({
  id,
  sku,
  nombre,
  precio,
  imagen,
  segundaImagen,
  precioPorBulto,
  unidadPorBulto,
  onVerDetalle,
}: Props) {
  const precioBulto = precioPorBulto || precio;
  const precioUnitario = unidadPorBulto
    ? precioBulto / unidadPorBulto
    : undefined;

  const [hover, setHover] = createSignal(false);

  const imagenMostrar = () =>
    hover() && segundaImagen ? segundaImagen : imagen;

  return (
    <div class="bg-white border p-2 md:p-4 flex flex-col relative shadow-sm">
      {/* Imagen (clickeable para ver detalle) */}
      <div
        class="cursor-pointer"
        onClick={onVerDetalle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <img
          src={`${import.meta.env.VITE_UPLOADS_URL}${imagenMostrar()}`}
          alt={nombre}
          class="object-contain h-36 md:h-44 w-full mt-1 md:mt-4 mb-2 transition-opacity duration-200"
        />
      </div>

      {/* Botón Agregar - solo en mobile */}
      <div class="flex md:hidden mb-2 justify-center">
        <button
          class="bg-white shadow rounded px-4 py-1 text-sm font-semibold border"
          onClick={(e) => {
            const imgEl = e.currentTarget
              .closest(".shadow-sm")
              ?.querySelector("img");

            if (imgEl instanceof HTMLImageElement) {
              animarHaciaCarrito(imgEl);
            }

            agregarAlCarrito(
              {
                id,
                nombre,
                precio: precioBulto,
                imagen,
                unidadPorBulto,
                precioPorBulto: precioBulto,
              },
              false
            );

            if (!esMobile()) {
              setCarritoAbierto(true);
            }
          }}
        >
          Agregar
        </button>
      </div>

      {/* Descripción técnica */}
      <p class="text-xs text-gray-600 mb-1">
        Click sobre el producto para descripción técnica
      </p>

      <h3 class="text-sm font-bold mb-1">{nombre}</h3>
      <p class="text-[11px] text-gray-400 mb-1 italic">SKU: {sku}</p>
      {precioUnitario && unidadPorBulto && (
        <p class="text-sm text-gray-800">
          {formatearPrecio(precioUnitario)} c/u
        </p>
      )}

      <p class="text-xs text-gray-600">
        {formatearPrecio(precioBulto)} x bulto ({unidadPorBulto} un)
      </p>

      {/* Botón Agregar - solo desktop */}
      <button
        class="hidden md:block absolute bottom-3 right-3 bg-white shadow-lg rounded-full p-4 text-1xl hover:scale-125 transition-transform duration-200"
        onClick={() => {
          agregarAlCarrito({
            id,
            nombre,
            precio: precioBulto,
            imagen,
            unidadPorBulto,
            precioPorBulto: precioBulto,
          });
          setCarritoAbierto(true);
        }}
      >
        Agregar
      </button>
    </div>
  );
}
