import { createSignal, For, Show, createEffect, onCleanup } from "solid-js";
import { debounce } from "../utils/debounce";
import type { Producto } from "../types/producto";
import type { Cliente } from "../types/cliente";
import type { PedidoPayload } from "../types/pedido";
import {
  buscarClientesPorTexto,
  crearCliente,
} from "../services/cliente.service";
import { buscarProductosPorTexto } from "../services/producto.service";
import { crearPedidoDesdePanel } from "../services/pedido.service";
import { formatearPrecio } from "../utils/formato";
import {
  obtenerProvincias,
  obtenerLocalidades,
} from "../services/ubicacion.service";
import { useAuth } from "../store/auth";

export default function PedidoRapido() {
  const { usuario } = useAuth();
  const [paso, setPaso] = createSignal<1 | 2 | 3>(1);
  const [clienteBusqueda, setClienteBusqueda] = createSignal("");
  const [clientes, setClientes] = createSignal<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    createSignal<Cliente | null>(null);
  const [nuevoCliente, setNuevoCliente] = createSignal<Partial<Cliente>>({
    nombre: "",
    email: "",
    telefono: "",
    cuit_cuil: "",
    razonSocial: "",
    direccion: "",
  });
  const [productoBusqueda, setProductoBusqueda] = createSignal("");
  const [productos, setProductos] = createSignal<Producto[]>([]);
  const [mostrarListaProductos, setMostrarListaProductos] = createSignal(false);
  const [carrito, setCarrito] = createSignal<
    { producto: Producto; cantidad: number }[]
  >([]);
  const [mensaje, setMensaje] = createSignal("");
  const [enviando, setEnviando] = createSignal(false);
  const [provincias, setProvincias] = createSignal<
    { id: number; nombre: string }[]
  >([]);
  const [localidades, setLocalidades] = createSignal<
    { id: number; nombre: string }[]
  >([]);
  const [erroresCliente, setErroresCliente] = createSignal<string[]>([]);

  createEffect(async () => {
    const provs = await obtenerProvincias();
    setProvincias(provs);
  });

  createEffect(async () => {
    const provId = nuevoCliente().provinciaId;
    if (provId) {
      const locs = await obtenerLocalidades(provId);
      setLocalidades(locs);
    } else {
      setLocalidades([]);
    }
  });

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
      setMostrarListaProductos(false);
      return;
    }
    const resultados = await buscarProductosPorTexto(texto);
    setProductos(resultados);
    setMostrarListaProductos(true);
  }, 300);

  createEffect(() => {
    if (productoBusqueda().length >= 2)
      buscarProductoDebounced(productoBusqueda());
    else {
      setProductos([]);
      setMostrarListaProductos(false);
    }
  });

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest("#listado-productos") &&
      !target.closest("#input-busqueda-producto")
    ) {
      setMostrarListaProductos(false);
    }
  };

  createEffect(() => {
    document.addEventListener("click", handleClickOutside);
    onCleanup(() => document.removeEventListener("click", handleClickOutside));
  });

  const agregarProducto = (producto: Producto) => {
    const yaEsta = carrito().find((item) => item.producto.id === producto.id);
    if (!yaEsta) {
      setCarrito([...carrito(), { producto, cantidad: 1 }]);
      setMostrarListaProductos(false);
    }
  };

  const cambiarCantidad = (id: number, cantidad: number) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.producto.id === id
          ? { ...item, cantidad: Math.max(1, cantidad) }
          : item
      )
    );
  };

  const quitarProducto = (id: number) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== id));
  };

  const confirmarPedido = async () => {
    if (carrito().length === 0) {
      setMensaje("❌ No podés enviar un pedido sin productos.");
      return;
    }

    const clienteData = clienteSeleccionado();
    if (!clienteData) return;

    const vendedorId = usuario()?.id;

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
      setPaso(1);
      setCarrito([]);
      setClienteSeleccionado(null);
      setClienteBusqueda("");
      setClientes([]);
    } catch (err) {
      setMensaje("❌ Error al crear el pedido");
    } finally {
      setEnviando(false);
    }
  };

  const crearNuevoClienteYAvanzar = async () => {
    const datos = nuevoCliente();
    const errores = [];
    if (!datos.nombre) errores.push("Nombre obligatorio");
    if (!datos.telefono) errores.push("Teléfono obligatorio");
    if (!datos.email) errores.push("Email obligatorio");
    if (!datos.cuit_cuil) errores.push("CUIT/CUIL obligatorio");
    if (!datos.direccion) errores.push("Dirección obligatoria");
    if (!datos.provinciaId) errores.push("Provincia obligatoria");
    if (!datos.localidadId) errores.push("Localidad obligatoria");
    setErroresCliente(errores);
    if (errores.length > 0) return;

    try {
      const nuevo = await crearCliente({
        ...datos,
        vendedorId: JSON.parse(window.localStorage.getItem("vendedor") || "{}")
          ?.id,
      });
      setClienteSeleccionado(nuevo);
      setPaso(3);
    } catch {
      setMensaje("❌ Error al crear el cliente");
    }
  };

  return (
    <div class="p-4 max-w-2xl mx-auto space-y-6 relative min-h-screen">
      <Show when={enviando()}>
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div class="text-white font-bold text-lg flex gap-2 items-center">
            Enviando pedido...
          </div>
        </div>
      </Show>

      <h2 class="text-xl font-bold text-center">📦 Pedido Rápido</h2>

      <div class="flex justify-between text-sm mb-4">
        <span class={paso() === 1 ? "font-bold text-blue-600" : ""}>
          🧑 Buscar Cliente
        </span>
        <span class={paso() === 2 ? "font-bold text-blue-600" : ""}>
          ➕ Nuevo Cliente
        </span>
        <span class={paso() === 3 ? "font-bold text-blue-600" : ""}>
          🛒 Pedido
        </span>
      </div>
      <Show when={mensaje()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div class="bg-white rounded-lg p-6 shadow-lg text-center max-w-sm">
            <h3 class="text-lg font-bold mb-2">
              {mensaje().startsWith("✅") ? "¡Pedido enviado!" : "Error"}
            </h3>
            <p class="text-sm text-gray-700 mb-4">{mensaje()}</p>
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setMensaje("")}
            >
              Cerrar
            </button>
          </div>
        </div>
      </Show>

      {/* Paso 1: buscar cliente */}
      <Show when={paso() === 1}>
        <div>
          <input
            class="border p-2 w-full rounded mb-2"
            placeholder="Buscar cliente por nombre, cuit, email..."
            value={clienteBusqueda()}
            onInput={(e) => setClienteBusqueda(e.currentTarget.value)}
          />
          <For
            each={clientes()}
            fallback={<p class="text-sm">No se encontraron clientes</p>}
          >
            {(cli) => (
              <div
                class="p-2 border rounded mb-2 cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  setClienteSeleccionado(cli);
                  setPaso(3);
                }}
              >
                {cli.nombre} — {cli.email}
              </div>
            )}
          </For>
          <button
            onClick={() => setPaso(2)}
            class="mt-3 underline text-blue-600 text-sm"
          >
            + Crear cliente nuevo
          </button>
        </div>
      </Show>

      {/* Paso 2: crear nuevo cliente */}
      <Show when={paso() === 2}>
        <div class="space-y-2">
          <input
            class="border p-2 w-full rounded"
            placeholder="Nombre"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                nombre: e.currentTarget.value,
              }))
            }
          />
          <input
            class="border p-2 w-full rounded"
            placeholder="Email"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                email: e.currentTarget.value,
              }))
            }
          />
          <input
            class="border p-2 w-full rounded"
            placeholder="Teléfono"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                telefono: e.currentTarget.value,
              }))
            }
          />
          <input
            class="border p-2 w-full rounded"
            placeholder="CUIT/CUIL"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                cuit_cuil: e.currentTarget.value,
              }))
            }
          />
          <input
            class="border p-2 w-full rounded"
            placeholder="Razón Social/Local"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                razonSocial: e.currentTarget.value,
              }))
            }
          />
          <input
            class="border p-2 w-full rounded"
            placeholder="Dirección"
            onInput={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                direccion: e.currentTarget.value,
              }))
            }
          />

          <select
            class="border p-2 w-full rounded"
            onChange={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                provinciaId: +e.currentTarget.value || undefined,
              }))
            }
          >
            <option value="">Seleccionar provincia</option>
            <For each={provincias()}>
              {(p) => <option value={p.id}>{p.nombre}</option>}
            </For>
          </select>

          <select
            class="border p-2 w-full rounded"
            onChange={(e) =>
              setNuevoCliente((prev) => ({
                ...prev,
                localidadId: +e.currentTarget.value || undefined,
              }))
            }
          >
            <option value="">Seleccionar localidad</option>
            <For each={localidades()}>
              {(l) => <option value={l.id}>{l.nombre}</option>}
            </For>
          </select>

          <button
            class="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={crearNuevoClienteYAvanzar}
          >
            Crear y continuar
          </button>
          <button
            onClick={() => setPaso(1)}
            class="text-sm underline text-gray-500 mt-2"
          >
            ← Volver
          </button>
        </div>
      </Show>

      {/* Paso 3: productos y carrito */}
      <Show when={paso() === 3}>
        <div class="space-y-4">
          <input
            id="input-busqueda-producto"
            class="border p-2 w-full rounded"
            placeholder="Buscar producto..."
            value={productoBusqueda()}
            onInput={(e) => setProductoBusqueda(e.currentTarget.value)}
          />
          <Show when={mostrarListaProductos()}>
            <div
              id="listado-productos"
              class="mt-1 max-h-72 overflow-auto border rounded divide-y bg-white z-10 relative"
            >
              <For each={productos()}>
                {(p) => (
                  <div class="p-2 flex gap-2 items-center hover:bg-gray-50">
                    <img
                      src={
                        p.Imagenes?.[0]?.url
                          ? `${import.meta.env.VITE_BACKEND_URL}${
                              p.Imagenes[0].url
                            }`
                          : "/sin-imagen.jpg"
                      }
                      alt={p.nombre || "Producto"}
                      class="w-14 h-14 object-cover rounded border"
                    />
                    <div class="flex-1 text-sm">
                      <div class="font-medium">{p.nombre}</div>
                      <div class="text-xs text-gray-500">
                        {p.unidadPorBulto} u. por bulto
                      </div>
                      <div class="text-xs text-gray-500">
                        Unitario: {formatearPrecio(p.precioUnitario || 0)}
                      </div>
                      <div class="text-sm font-semibold">
                        Bulto: {formatearPrecio(p.precioPorBulto || 0)}
                      </div>
                    </div>
                    <button
                      class="bg-green-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => agregarProducto(p)}
                    >
                      + Agregar
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
          <div class="border-t pt-4">
            <h3 class="font-semibold mb-2">🛒 Carrito</h3>
            <For each={carrito()}>
              {(item) => (
                <div class="flex gap-2 border-b py-2 text-sm items-center">
                  <img
                    src={
                      item.producto.Imagenes?.[0]?.url
                        ? `${import.meta.env.VITE_BACKEND_URL}${
                            item.producto.Imagenes[0].url
                          }`
                        : "/sin-imagen.jpg"
                    }
                    alt={item.producto.nombre || "Producto"}
                    class="w-14 h-14 object-cover rounded border"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-sm">
                      {item.producto.nombre}
                    </div>
                    <div class="text-xs text-gray-500">
                      {item.producto.unidadPorBulto} u. por bulto
                    </div>
                    <div class="text-xs text-gray-500">
                      Unitario:{" "}
                      {formatearPrecio(item.producto.precioUnitario || 0)}
                    </div>
                    <div class="text-sm font-semibold">
                      Bulto:{" "}
                      {formatearPrecio(item.producto.precioPorBulto || 0)}
                    </div>
                  </div>
                  <div class="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      class="border rounded w-20 text-center text-sm"
                      onInput={(e) =>
                        cambiarCantidad(
                          item.producto.id,
                          +e.currentTarget.value
                        )
                      }
                    />
                    <button
                      onClick={() => quitarProducto(item.producto.id)}
                      class="text-red-600 text-xs"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              )}
            </For>
            <div class="text-right font-semibold mt-2">
              Total:{" "}
              {formatearPrecio(
                carrito().reduce(
                  (acc, i) =>
                    acc + (i.producto.precioPorBulto || 0) * i.cantidad,
                  0
                )
              )}
            </div>
            <button
              class="bg-blue-700 text-white w-full py-2 rounded mt-4"
              disabled={carrito().length === 0 || !clienteSeleccionado()}
              onClick={confirmarPedido}
            >
              Confirmar pedido
            </button>
            <button
              onClick={() => setPaso(clienteSeleccionado() ? 1 : 2)}
              class="text-sm underline text-gray-500 mt-2"
            >
              ← Volver
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
