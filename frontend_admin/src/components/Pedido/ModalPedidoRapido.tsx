// frontend_admin/components/ModalPedidoRapido.tsx
import {
    createEffect,
    createResource,
    createSignal,
    For,
    Show,
  } from 'solid-js';
  import type { Cliente } from '../../types/cliente';
  import type { Producto } from '../../types/producto';
  import { buscarClientesPorTexto } from '../../services/cliente.service';
  import { buscarProductosPorTexto } from '../../services/producto.service';
  import { crearPedidoDesdePanel } from '../../services/pedido.service';
  import ModalMensaje from '../Layout/ModalMensaje';
  
  export default function ModalPedidoRapido(props: {
    abierto: boolean;
    onCerrar: (mensaje?: string) => void;
  }) {
    const [paso, setPaso] = createSignal<1 | 2 | 3>(1);
    const [busquedaCliente, setBusquedaCliente] = createSignal('');
    const [clienteSeleccionado, setClienteSeleccionado] = createSignal<Cliente | null>(null);
    const [clientes] = createResource(busquedaCliente, buscarClientesPorTexto);
    const [nuevoCliente, setNuevoCliente] = createSignal({
      nombre: '', email: '', telefono: '', cuit_cuil: '',
    });
    const [busquedaProducto, setBusquedaProducto] = createSignal('');
    const [productos] = createResource(busquedaProducto, buscarProductosPorTexto);
    const [carrito, setCarrito] = createSignal<{ producto: Producto; cantidad: number }[]>([]);
    const [mensaje, setMensaje] = createSignal('');
  
    createEffect(() => {
      if (!props.abierto) {
        setPaso(1);
        setBusquedaCliente('');
        setClienteSeleccionado(null);
        setNuevoCliente({ nombre: '', email: '', telefono: '', cuit_cuil: '' });
        setBusquedaProducto('');
        setCarrito([]);
      }
    });
  
    const agregarAlCarrito = (producto: Producto) => {
      const yaExiste = carrito().find((item) => item.producto.id === producto.id);
      if (!yaExiste) {
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
  
    const enviarPedido = async () => {
      try {
        const cliente = clienteSeleccionado() || {
          id: 0,
          nombre: nuevoCliente().nombre,
          email: nuevoCliente().email,
          telefono: nuevoCliente().telefono,
          direccion: '',
          cuit_cuil: nuevoCliente().cuit_cuil,
          createdAt: '',
          updatedAt: '',
          razonSocial: '',
          provinciaId: undefined,
          localidadId: undefined,
          vendedorId: undefined,
        };
    
        const carritoFinal = carrito().map((item) => ({
          id: item.producto.id,
          cantidad: item.cantidad,
          precio: item.producto.precioPorBulto ?? 0,
          unidadPorBulto: item.producto.unidadPorBulto ?? 0,
        }));
    
        await crearPedidoDesdePanel({ cliente, carrito: carritoFinal });
        props.onCerrar('Pedido creado correctamente ✅');
      } catch (err) {
        setMensaje('Error al crear el pedido');
      }
    };
    
  
    return (
      <Show when={props.abierto}>
        <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded w-full max-w-2xl">
            <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
  
            <h2 class="text-xl font-bold mb-4">Nuevo pedido rápido</h2>
  
            <Show when={paso() === 1}>
              <div>
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre, cuit, email..."
                  class="border p-2 w-full mb-3"
                  value={busquedaCliente()}
                  onInput={(e) => setBusquedaCliente(e.currentTarget.value)}
                />
                <For each={clientes()} fallback={<p>No se encontraron clientes</p>}>
                  {(cli) => (
                    <div
                      class="border p-2 rounded mb-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setClienteSeleccionado(cli);
                        setPaso(3);
                      }}
                    >
                      {cli.nombre} — {cli.cuit_cuil} — {cli.email}
                    </div>
                  )}
                </For>
                <div class="text-center mt-4">
                  <button
                    class="bg-blue-600 text-white px-4 py-1 rounded"
                    onClick={() => setPaso(2)}
                  >
                    Crear cliente nuevo
                  </button>
                </div>
              </div>
            </Show>
  
            <Show when={paso() === 2}>
              <div class="space-y-3">
                <input class="border p-2 rounded w-full" placeholder="Nombre" onInput={(e) => setNuevoCliente((prev) => ({ ...prev, nombre: e.currentTarget.value }))} />
                <input class="border p-2 rounded w-full" placeholder="Email" onInput={(e) => setNuevoCliente((prev) => ({ ...prev, email: e.currentTarget.value }))} />
                <input class="border p-2 rounded w-full" placeholder="Teléfono" onInput={(e) => setNuevoCliente((prev) => ({ ...prev, telefono: e.currentTarget.value }))} />
                <input class="border p-2 rounded w-full" placeholder="CUIT/CUIL" onInput={(e) => setNuevoCliente((prev) => ({ ...prev, cuit_cuil: e.currentTarget.value }))} />
                <button
                  class="bg-green-600 text-white px-4 py-2 rounded w-full"
                  onClick={() => setPaso(3)}
                >
                  Continuar con pedido
                </button>
              </div>
            </Show>
  
            <Show when={paso() === 3}>
              <div class="space-y-3">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  class="border p-2 rounded w-full"
                  value={busquedaProducto()}
                  onInput={(e) => setBusquedaProducto(e.currentTarget.value)}
                />
                <For each={productos()} fallback={<p>No hay productos</p>}>
                  {(prod) => (
                    <div class="border p-2 rounded flex justify-between items-center">
                      <span>{prod.nombre}</span>
                      <button
                        onClick={() => agregarAlCarrito(prod)}
                        class="bg-blue-600 text-white px-3 py-1 rounded"
                      >Agregar</button>
                    </div>
                  )}
                </For>
                <hr class="my-4" />
                <h3 class="text-lg font-bold">Carrito</h3>
                <For each={carrito()}>
                  {(item) => (
                    <div class="flex justify-between items-center">
                      <span>{item.producto.nombre}</span>
                      <input
                        type="number"
                        min="1"
                        class="border p-1 w-20 text-right"
                        value={item.cantidad}
                        onInput={(e) => cambiarCantidad(item.producto.id, +e.currentTarget.value)}
                      />
                    </div>
                  )}
                </For>
                <button
                  onClick={enviarPedido}
                  class="bg-green-600 text-white w-full py-2 rounded mt-4"
                >
                  Confirmar pedido
                </button>
              </div>
            </Show>
  
            <div class="text-right mt-6">
              <button
                onClick={() => props.onCerrar()}
                class="bg-gray-300 px-4 py-1 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Show>
    );
  }
  