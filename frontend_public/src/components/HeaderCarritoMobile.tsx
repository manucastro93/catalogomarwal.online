import { Show } from "solid-js";
import { carrito, carritoAbierto, setCarritoAbierto } from "../store/carrito";
import { formatearPrecio } from "../utils/formato";

export default function HeaderCarritoMobile() {
  const total = () =>
    carrito.reduce((sum, p) => {
      const precio = Number(p.precio) || 0;
      const cantidad = Number(p.cantidad) || 0;
      return sum + precio * cantidad;
    }, 0);

  return (
    <Show when={carrito.length > 0}>
      <div class="fixed top-0 left-0 right-0 z-50 bg-black text-white text-center md:hidden">
        <div class="py-2 text-lg font-semibold">
          <span id="carrito-icono" class="pt-4 inline-block relative text-3xl">
          🛒
         </span>{" "} 
         Total: {formatearPrecio(total())}</div>
        {/* Flechita SVG sobresaliente */}
        <div class="relative w-full h-6 overflow-visible">
          <svg
            class="bg-black w-[100px] h-10 rounded-[16px] mx-auto cursor-pointer flex items-center justify-center text-white text-2xl z-[999]" 
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => setCarritoAbierto(!carritoAbierto())}
          >
            <path
              d={
                carritoAbierto()
                  ? "M6 15L12 9L18 15" // Flecha arriba
                  : "M6 9L12 15L18 9" // Flecha abajo
              }
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div class="h-[67px] md:hidden" />
    </Show>
  );
}
