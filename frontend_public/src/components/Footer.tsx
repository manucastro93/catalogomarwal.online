import { createSignal, onMount, Show } from "solid-js";

export default function Footer() {
  const [clienteId, setClienteId] = createSignal<string | null>(null);
  const [vendedorNombre, setVendedorNombre] = createSignal("desconocido");

  onMount(() => {
    setClienteId(localStorage.getItem("clienteId"));

    const vendedorRaw = localStorage.getItem("vendedor");
    const vendedor = vendedorRaw ? JSON.parse(vendedorRaw) : null;
    if (vendedor?.nombre) {
      setVendedorNombre(vendedor.nombre);
    }
  });

  return (
    <footer class="bg-gray-100 text-sm text-gray-600 py-6 mt-10 border-t">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div class="flex gap-4">
          <a href="/" class="hover:underline">Inicio</a>

          <Show when={clienteId()}>
            <a href="/mis-pedidos" class="hover:underline font-medium text-black">
              Mis pedidos
            </a>
          </Show>
          <span>Tu vendedor es: {vendedorNombre()}</span>
        </div>
      </div>
    </footer>
  );
}
