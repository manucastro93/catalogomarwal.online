// ProductoCard.tsx
import { agregarAlCarrito } from "../store/carrito";

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

      <p class="text-sm text-gray-800">${precioBulto.toFixed(2)} por bulto</p>

      {precioUnitario && unidadPorBulto && (
        <p class="text-xs text-gray-500">
          (${precioUnitario.toFixed(2)} c/u x {unidadPorBulto})
        </p>
      )}

      <button
        class="absolute bottom-2 right-2 bg-white shadow-lg rounded-full p-4 text-1xl hover:scale-125 transition-transform duration-200"
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
        🛒
      </button>
    </div>
  );
}
