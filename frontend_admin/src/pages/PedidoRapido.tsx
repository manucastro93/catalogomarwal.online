import { createSignal, For, Show, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { debounce } from "../utils/debounce";
import type { Producto } from "../types/producto";
import type { Cliente } from "../types/cliente";
import type { PedidoPayload } from "../types/pedido";
import { buscarClientesPorTexto } from "../services/cliente.service";
import { buscarProductosPorTexto } from "../services/producto.service";
import { crearPedidoDesdePanel } from "../services/pedido.service";
import { formatearPrecio } from "../utils/formato";

export default function PedidoRapido() {
  const [clienteBusqueda, setClienteBusqueda] = createSignal("");
  const [clientes, setClientes] = createSignal<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = createSignal<Cliente | null>(null);
  const [productoBusqueda, setProductoBusqueda] = createSignal("");
  const [productos, setProductos] = createSignal<Producto[]>([]);
  const [carrito, setCarrito] = createSignal<{ producto: Producto; cantidad: number }[]>([]);
  const [mensaje, setMensaje] = createSignal("");
  const [enviando, setEnviando] = createSignal(false);

  const debouncedBuscarCliente = debounce(async () => {
    const resultados = await buscarClientesPorTexto(clienteBusqueda());
    setClientes(resultados);
  }, 300);

  createEffect(() => {
    if (clienteBusqueda().length >= 2) debouncedBuscarCliente();
  });

  const buscarProductoDebounced = debounce(async (texto: string) => {
    if (!texto.trim()) {
      setProductos([]);
      return;
    }
    const resultados = await buscarProductosPorTexto(texto);
    setProductos(resultados);
  }, 300);

  createEffect(() => {
    if (productoBusqueda().length >= 2) buscarProductoDebounced(productoBusqueda());
    else setProductos([]);
  });

  const agregarProducto = (producto: Producto) => {
    const yaEsta = carrito().find((item) => item.producto.id === producto.id);
    if (!yaEsta) {
      setCarrito([...carrito(), { producto, cantidad: 1 }]);
    }
  };

  const cambiarCantidad = (id: number, cantidad: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.producto.id === id ? { ...item, cantidad: Math.max(1, cantidad) } : item
      )
    );
  };

  const quitarProducto = (id: number) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== id));
  };

  const confirmarPedido = async () => {
    const clienteData = clienteSeleccionado();
    if (!clienteData || !clienteData.id) return;
  
    let vendedorId = clienteData.vendedorId;
    if (!vendedorId) {
      try {
        vendedorId = JSON.parse(localStorage.getItem("vendedor") || "{}")?.id || undefined;
      } catch {
        vendedorId = undefined;
      }
    }
  
    const payload: PedidoPayload = {
      cliente: { ...clienteData, vendedorId },
      carrito: carrito().map((item) => ({
        id: item.producto.id,
        cantidad: item.cantidad,
        precio: item.producto.precioPorBulto || 0,
        unidadPorBulto: item.producto.unidadPorBulto || 1,
      })),
      usuarioId: vendedorId,
    };
  
    try {
      setEnviando(true);
      await crearPedidoDesdePanel(payload);
      setMensaje("✅ Pedido creado correctamente");
      setCarrito([]);
      setClienteSeleccionado(null);
      setClientes([]);
      setClienteBusqueda("");
    } catch (err) {
      setMensaje("❌ Error al crear el pedido");
    } finally {
      setEnviando(false);
    }
  };
  

  return (
    <div class="p-4 space-y-6 max-w-2xl mx-auto relative">
      <Show when={enviando()}>
        <div class="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div class="text-white text-lg font-bold flex items-center gap-2">
            <img src="/cargando.gif" alt="cargando" class="w-6 h-6" /> Enviando pedido...
          </div>
        </div>
      </Show>

      <h2 class="text-xl font-bold text-center">📦 Pedido Rápido</h2>

      {/* Buscar Cliente */}
      <div>
        <label class="font-semibold block mb-1">Buscar Cliente</label>
        <input
          class="border p-2 w-full rounded mb-2 text-sm"
          placeholder="Nombre, email, cuit, razón social"
          value={clienteBusqueda()}
          onInput={(e) => setClienteBusqueda(e.currentTarget.value)}
        />
        <Show when={clientes().length > 0}>
          <div class="mt-2 border rounded max-h-60 overflow-auto divide-y">
            <For each={clientes()}>{(cli) => (
              <div
                class="p-2 cursor-pointer hover:bg-blue-50 text-sm"
                onClick={() => setClienteSeleccionado(cli)}
              >
                {cli.nombre} - {cli.email}
              </div>
            )}</For>
          </div>
        </Show>
        <Show when={clienteSeleccionado()}>
          <div class="mt-3 p-2 bg-green-100 rounded text-sm">
            Cliente: <strong>{clienteSeleccionado()?.nombre}</strong>
          </div>
        </Show>
      </div>

      {/* Buscar Producto */}
      <div>
        <label class="font-semibold block mb-1">Buscar Producto</label>
        <input
          class="border p-2 w-full rounded mb-2 text-sm"
          placeholder="SKU, nombre o categoría"
          value={productoBusqueda()}
          onInput={(e) => {
            const texto = e.currentTarget.value;
            setProductoBusqueda(texto);
            buscarProductoDebounced(texto);
          }}
        />
        <Show when={productos().length > 0}>
          <div class="mt-2 border rounded divide-y max-h-72 overflow-auto">
            <For each={productos()}>{(p) => (
              <div class="p-2 flex justify-between items-center text-sm gap-4">
                <div class="flex gap-2 items-center">
                  <img
                    src={
                      p.Imagenes?.[0]?.url
                        ? `${import.meta.env.VITE_BACKEND_URL}${p.Imagenes[0].url}`
                        : "/sin-imagen.jpg"
                    }
                    alt={p.nombre || "Producto sin nombre"}
                    class="w-14 h-14 object-cover rounded border"
                  />
                  <div>
                    <div class="text-xs text-gray-500">SKU: {p.sku}</div>
                    <div class="font-medium">{p.nombre}</div>
                    <div class="text-xs text-gray-500">
                      {p.unidadPorBulto} unidades por bulto
                    </div>
                    <div class="text-xs text-gray-500">
                      Unitario: {formatearPrecio(p.precioUnitario || 0)}
                    </div>
                    <div class="text-sm font-semibold">
                      Bulto: {formatearPrecio(p.precioPorBulto || 0)}
                    </div>
                  </div>
                </div>
                <button
                  class="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => agregarProducto(p)}
                >
                  + Agregar
                </button>
              </div>
            )}</For>
          </div>
        </Show>
      </div>

      {/* Carrito */}
      <div>
        <h3 class="text-lg font-semibold">🛒 Carrito</h3>
        <Show
          when={carrito().length > 0}
          fallback={<p class="text-sm text-gray-500">Todavía no hay productos.</p>}
        >
          <div class="space-y-2 mt-2">
            <For each={carrito()}>{(item) => (
              <div class="flex gap-2 items-center border p-2 rounded text-sm">
                <img
                  src={
                    item.producto.Imagenes?.[0]?.url
                      ? `${import.meta.env.VITE_BACKEND_URL}${item.producto.Imagenes[0].url}`
                      : "/sin-imagen.jpg"
                  }
                  alt={item.producto.nombre || "Producto sin nombre"}
                  class="w-14 h-14 object-cover rounded border"
                />
                <div class="flex-1">
                  <div class="font-medium">{item.producto.nombre}</div>
                  <div class="text-xs text-gray-500">
                    {item.producto.unidadPorBulto} unidades por bulto
                  </div>
                  <div class="text-xs text-gray-500">
                    Unitario: {formatearPrecio(item.producto.precioUnitario || 0)}
                  </div>
                  <div class="text-sm font-semibold">
                    Bulto: {formatearPrecio(item.producto.precioPorBulto || 0)}
                  </div>
                </div>
                <div class="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    class="w-16 border rounded p-1 text-center text-sm"
                    onInput={(e) =>
                      cambiarCantidad(item.producto.id, parseInt(e.currentTarget.value))
                    }
                  />
                  <button
                    class="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => quitarProducto(item.producto.id)}
                  >
                    X
                  </button>
                </div>
              </div>
            )}</For>
          </div>
          <div class="text-right font-semibold text-base mt-2">
            Total:{" "}
            {formatearPrecio(
              carrito().reduce(
                (acc, item) =>
                  acc + (item.producto.precioPorBulto || 0) * item.cantidad,
                0
              )
            )}
          </div>
        </Show>
      </div>

      {/* Confirmar */}
      <div class="text-center">
        <Show when={mensaje()}>
          <p class="mb-2 text-sm text-blue-600">{mensaje()}</p>
        </Show>
        <button
          class="bg-blue-700 text-white w-full py-3 rounded text-lg mt-4"
          disabled={!clienteSeleccionado() || carrito().length === 0}
          onClick={confirmarPedido}
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  );
}
