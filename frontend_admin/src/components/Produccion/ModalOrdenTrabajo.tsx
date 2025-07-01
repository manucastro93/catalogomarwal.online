import { createSignal, Show, For, createResource } from 'solid-js';
import { buscarProductosPorTexto } from '@/services/producto.service';
import { guardarOrdenTrabajo } from '@/services/ordenTrabajo.service';
import { obtenerPlantas } from '@/services/planta.service';
import { useAuth } from '@/store/auth';
import type { Producto } from '@/types/producto';
import type { CrearOrdenTrabajo } from '@/types/ordenTrabajo';
import { formatearPrecio } from '@/utils/formato';

export default function ModalOrdenTrabajo(props: { onCerrar: () => void }) {
  const [busqueda, setBusqueda] = createSignal("");
  const [productos] = createResource(busqueda, buscarProductosPorTexto);
  const [items, setItems] = createSignal<
    { producto: Producto; cantidad?: number }[]
  >([]);
  const [mensaje, setMensaje] = createSignal("");
  const { usuario } = useAuth();

  const [plantas] = createResource(obtenerPlantas);
  const [plantaId, setPlantaId] = createSignal<string>("");
  const [turno, setTurno] = createSignal("");
  const [fecha, setFecha] = createSignal(""); // Fecha de la orden
  const [nota, setNota] = createSignal(""); // Nota opcional

  const agregarItem = (producto: Producto) => {
    const yaExiste = items().find((item) => item.producto.id === producto.id);
    if (!yaExiste) {
      setItems([...items(), { producto, cantidad: undefined }]);
    }
    setBusqueda("");
  };

  const cambiarCantidad = (productoId: number, cantidad?: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const eliminarItem = (productoId: number) => {
    setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const guardarOrden = async () => {
    const usuarioId = usuario()?.id;
    if (!usuarioId) {
      setMensaje("Error: usuario no identificado.");
      return;
    }
    if (!fecha()) {
      setMensaje("Seleccioná una fecha.");
      return;
    }
    if (!turno()) {
      setMensaje("Seleccioná un turno.");
      return;
    }
    if (!plantaId()) {
      setMensaje("Seleccioná una planta.");
      return;
    }
    if (
      items().some(
        (item) => typeof item.cantidad !== "number" || item.cantidad < 1
      )
    ) {
      setMensaje("Todos los productos deben tener cantidad mayor a 0");
      return;
    }
    if (items().length === 0) {
      setMensaje("Agregá al menos un producto a la orden");
      return;
    }
    // Armamos un solo payload con todos los ítems
    const payload: CrearOrdenTrabajo = {
      fecha: fecha(),
      turno: turno() as "mañana" | "tarde" | "noche",
      plantaId: parseInt(plantaId()),
      usuarioId,
      nota: nota() || undefined,
      productos: items().map((item) => ({
        productoId: item.producto.id,
        cantidad: item.cantidad as number,
      })),
    };
    await guardarOrdenTrabajo(payload);
    props.onCerrar();
  };

  // Fecha por default (hoy)
  const hoy = new Date().toISOString().split('T')[0];

  // Calcula el total de la orden
  const totalOrden = () =>
    items().reduce(
      (acc, item) =>
        acc +
        (item.cantidad && item.producto.precioUnitario
          ? item.cantidad * item.producto.precioUnitario
          : 0),
      0
    );

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl h-full md:h-[90vh] p-4 md:p-6 border border-gray-300 flex flex-col overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Crear Orden de Trabajo</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm">
          <input
            type="date"
            class="border p-2 rounded"
            value={fecha() || hoy}
            min={hoy}
            onInput={(e) => setFecha(e.currentTarget.value)}
          />
          <select
            class="border p-2 rounded"
            value={turno()}
            onChange={(e) => setTurno(e.currentTarget.value)}
          >
            <option value="">Seleccioná turno</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
          <select
            class="border p-2 rounded"
            value={plantaId()}
            onChange={(e) => setPlantaId(e.currentTarget.value)}
          >
            <option value="">Seleccioná planta</option>
            <For each={plantas()}>{(p) =>
              <option value={p.id.toString()}>{p.nombre}</option>
            }</For>
          </select>
          <input
            type="text"
            placeholder="Notas/instrucciones (opcional)"
            class="border p-2 rounded"
            value={nota()}
            onInput={(e) => setNota(e.currentTarget.value)}
            maxlength={200}
          />
        </div>

        <div class="mb-3">
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU..."
            class="border p-2 w-full rounded"
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />
        </div>

        <div class="flex-1 overflow-y-auto">
          {/* Sugerencias de productos */}
          <Show when={busqueda() && productos()}>
            <div class="space-y-2 max-h-60 overflow-y-auto border p-2 mb-4 rounded">
              <For each={productos()} fallback={<p>No hay productos</p>}>
                {(prod) => (
                  <div class="flex justify-between items-center border-b py-1">
                    <span class="text-sm">{prod.sku} — {prod.nombre}</span>
                    <button
                      onClick={() => agregarItem(prod)}
                      class="bg-blue-600 text-white px-3 py-1 text-sm rounded"
                    >
                      Seleccionar
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Vista mobile */}
          <Show when={items().length > 0}>
            <div class="md:hidden space-y-3 mb-4">
              <For each={items()}>
                {(item) => (
                  <div class="border rounded p-2 bg-white text-sm">
                    <div><strong>SKU:</strong> {item.producto.sku}</div>
                    <div><strong>Producto:</strong> {item.producto.nombre}</div>
                    <div><strong>Precio unitario:</strong> $ {item.producto.precioUnitario?.toLocaleString("es-AR") ?? "-"}</div>
                    <div>
                      <strong>Subtotal:</strong>{" "}
                      {item.cantidad && item.producto.precioUnitario
                        ? `$ ${(item.cantidad * item.producto.precioUnitario).toLocaleString("es-AR")}`
                        : "-"}
                    </div>
                    <div class="flex justify-between items-center mt-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.cantidad ?? ""}
                        class="border p-1 w-24 text-right text-sm"
                        onChange={(e) => {
                          const valor = e.currentTarget.value;
                          const numero = parseInt(valor);
                          cambiarCantidad(
                            item.producto.id,
                            isNaN(numero) ? undefined : numero
                          );
                        }}
                      />
                      <button
                        onClick={() => eliminarItem(item.producto.id)}
                        class="text-red-600 text-sm hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </For>
              {/* Total general mobile */}
              <div class="flex justify-end mt-2">
                <span class="font-bold text-lg">
                  Total: ${" "}
                  {totalOrden().toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </Show>

          {/* Vista desktop */}
          <Show when={items().length > 0}>
            <div class="hidden md:block overflow-x-auto mb-4">
              <table class="w-full text-sm text-left border table-fixed">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="p-2 w-[120px]">SKU</th>
                    <th class="p-2">Producto</th>
                    <th class="p-2 w-[100px]">Cantidad</th>
                    <th class="p-2 w-[100px] text-right">Precio Unitario</th>
                    <th class="p-2 w-[100px] text-right">Subtotal</th>
                    <th class="p-2 w-[80px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={items()}>
                    {(item) => (
                      <tr class="border-t">
                        <td class="p-2 truncate">{item.producto.sku}</td>
                        <td class="p-2 truncate">{item.producto.nombre}</td>
                        <td class="p-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad ?? ""}
                            class="border p-1 w-full text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onChange={(e) => {
                              const valor = e.currentTarget.value;
                              const numero = parseInt(valor);
                              cambiarCantidad(
                                item.producto.id,
                                isNaN(numero) ? undefined : numero
                              );
                            }}
                          />
                        </td>
                        <td class="p-2 text-right">
                          {formatearPrecio(item.producto.precioUnitario) ?? "-"}
                        </td>
                        <td class="p-2 text-right">
                          {item.cantidad && item.producto.precioUnitario
                            ? `${formatearPrecio(item.cantidad * item.producto.precioUnitario)}`
                            : "-"}
                        </td>
                        <td class="p-2 text-right">
                          <button
                            onClick={() => eliminarItem(item.producto.id)}
                            class="text-red-600 text-sm hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
              {/* Total general desktop */}
              <div class="flex justify-end mt-2">
                <span class="font-bold text-lg">
                  Total: ${" "}
                  {totalOrden().toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </Show>
        </div>

        <Show when={mensaje()}>
          <p class="text-red-600 text-sm mb-2">{mensaje()}</p>
        </Show>

        <div class="flex justify-end gap-2 mt-6">
          <button
            onClick={props.onCerrar}
            class="px-4 py-2 border rounded text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={guardarOrden}
            class="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Guardar Orden
          </button>
        </div>
      </div>
    </div>
  );
}
