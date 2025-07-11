import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

export const [carrito, setCarrito] = createStore<
  {
    id: number;
    nombre: string;
    precioUnitario: number;
    cantidad: number; // cantidad de bultos
    imagen: string;
    precioPorBulto?: number;
    unidadPorBulto?: number;
  }[]
>([]);

export const [carritoAbierto, setCarritoAbierto] = createSignal(false);

function syncLocalStorage(actualizado: typeof carrito) {
  localStorage.setItem('carrito', JSON.stringify(actualizado));
}

export function agregarAlCarrito(
  item: {
    id: number;
    nombre: string;
    precioUnitario: number;
    imagen: string;
    precioPorBulto?: number;
    unidadPorBulto?: number;
  },
  abrir = true // ← parámetro opcional
) {
  const index = carrito.findIndex((p) => p.id === item.id);
  let actualizado;
  if (index >= 0) {
    actualizado = carrito.map((p, i) =>
      i === index ? { ...p, cantidad: p.cantidad + 1 } : p
    );
  } else {
    actualizado = [...carrito, { ...item, cantidad: 1 }];
  }
  setCarrito(actualizado);
  syncLocalStorage(actualizado);

  if (abrir) {
    setCarritoAbierto(true);
  }
}


export function quitarDelCarrito(id: number) {
  const actualizado = carrito.filter((p) => p.id !== id);
  setCarrito(actualizado);
  syncLocalStorage(actualizado);
}

export function cambiarCantidad(id: number, cantidad: number) {
  const actualizado = carrito.map((p) =>
    p.id === id ? { ...p, cantidad } : p
  );
  setCarrito(actualizado);
  syncLocalStorage(actualizado);
}

export function limpiarCarrito() {
  setCarrito([]);
  syncLocalStorage([]);
}
