
import { agregarAlCarrito } from "../store/carrito";
import { formatearPrecio } from "../utils/formato";

interface Props {
  id: number;
  nombre: string;
  precio: number; // precio por bulto
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
    <div class="bg-white border p-2 flex flex-col relative shadow-sm">
      <div class="cursor-pointer" onClick={onVerDetalle}>
        <img
          src={`${import.meta.env.VITE_UPLOADS_URL}${imagen}`}
          alt={nombre}
          class="object-contain h-70 w-full mb-2"
        />
        <p class="text-xs text-gray-600 mb-1">
          Click sobre el producto para descripción técnica
        </p>
      </div>

      <h3 class="text-sm font-bold mb-1">{nombre}</h3>

      <p class="text-sm text-gray-800">{formatearPrecio(precioBulto)} x bulto</p>

      {precioUnitario && unidadPorBulto && (
        <p class="text-xs text-gray-500">
          ({formatearPrecio(precioUnitario)} c/u x {unidadPorBulto}un)
        </p>
      )}

      <button
        class="absolute bottom-3 right-3 bg-white shadow-lg rounded-full p-4 text-1xl hover:scale-125 transition-transform duration-200"
        onClick={() =>
          agregarAlCarrito({
            id,
            nombre,
            precio: precioBulto,
            imagen,
            unidadPorBulto,
            precioPorBulto: precioBulto,
          })
        }
      >
        Agregar
      </button>
    </div>
  );
}
