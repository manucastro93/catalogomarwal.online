// 🔵 SolidJS imports
import { createSignal, onMount, Show } from "solid-js";
// 🌐 Services
import { obtenerMisPedidos } from "@/services/pedido.service";


export default function Footer() {
  const [hayPedidos, setHayPedidos] = createSignal(false);
  const [vendedorNombre, setVendedorNombre] = createSignal("desconocido");

  onMount(async () => {
    try {
      const pedidos = await obtenerMisPedidos();
      const tiene = Array.isArray(pedidos) && pedidos.length > 0;
      setHayPedidos(tiene);
    } catch (error) {
      console.warn("⚠️ No se pudieron cargar los pedidos:", error);
      setHayPedidos(false);
    }
  
    const vendedorRaw = localStorage.getItem("vendedor");
    if (vendedorRaw) {
      try {
        const vendedor = JSON.parse(vendedorRaw);
        if (vendedor?.nombre) {
          setVendedorNombre(vendedor.nombre);
        }
      } catch {}
    }
  });
  
  

  return (
    <footer class="bg-gray-100 text-lg text-gray-600 py-10 mt-10 border-t">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div class="flex gap-4 flex-wrap items-center">
          <a href="/" class="hover:underline">Inicio</a>

          <Show when={hayPedidos()}>
            <a href="/mis-pedidos" class="hover:underline font-medium text-black">
              Mis pedidos
            </a>
          </Show>

          <span>Tu vendedor es: <strong>{vendedorNombre()}</strong></span>
        </div>
      </div>
    </footer>
  );
}
