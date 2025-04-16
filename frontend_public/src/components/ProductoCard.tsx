import { agregarAlCarrito, setCarritoAbierto } from "../store/carrito";
import { formatearPrecio } from "../utils/formato";
import { animarHaciaCarrito } from "../utils/animarHaciaCarrito";
import { esMobile } from "../utils/esMobile";

interface Props {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  precioPorBulto?: number;
  unidadPorBulto?: number;
  onVerDetalle?: () => void;
}

export default function ProductoCard({
  id,
  nombre,
  precio,
  imagen,
  precioPorBulto,
  unidadPorBulto,
  onVerDetalle,
}: Props) {
  const precioBulto = precioPorBulto || precio;
  const precioUnitario = unidadPorBulto
    ? precioBulto / unidadPorBulto
    : undefined;

  return (
    <div class="bg-white border p-2 md:p-4 flex flex-col relative shadow-sm">
      {/* Imagen (clickeable para ver detalle) */}
      <div class="cursor-pointer" onClick={onVerDetalle}>
        <img
          src={`${import.meta.env.VITE_UPLOADS_URL}${imagen}`}
          alt={nombre}
          class="object-contain h-36 md:h-44 w-full mt-1 md:mt-4 mb-2"
        />
      </div>

      {/* Botón Agregar - solo en mobile (centrado, fuera del área clickeable) */}
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
              false // no abrir el carrito en mobile
            );

            if (!esMobile()) {
              setCarritoAbierto(true); // solo abrir en desktop
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

      <p class="text-sm text-gray-800">{formatearPrecio(precioBulto)} x bulto</p>

      {precioUnitario && unidadPorBulto && (
        <p class="text-xs text-gray-500">
          ({formatearPrecio(precioUnitario)} c/u x {unidadPorBulto}un)
        </p>
      )}

      {/* Botón Agregar - desktop (posición absoluta) */}
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
