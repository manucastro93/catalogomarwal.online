import { Show } from "solid-js";

export default function Footer() {
  const clienteId = localStorage.getItem("clienteId");
  const vendedor = JSON.parse(localStorage.getItem('vendedor') || '{}');
  const nombre = vendedor.nombre || 'desconocido';
  return (
    <footer class="bg-gray-100 text-sm text-gray-600 py-6 mt-10 border-t">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        
        <div class="flex gap-4">
          <a href="/" class="hover:underline">Inicio</a>

          <Show when={clienteId}>
            <a href="/mis-pedidos" class="hover:underline font-medium text-black">
              Mis pedidos
            </a>
            <span>Tu vendedor es: {nombre}</span>
          </Show>
        </div>
      </div>
    </footer>
  );
}
