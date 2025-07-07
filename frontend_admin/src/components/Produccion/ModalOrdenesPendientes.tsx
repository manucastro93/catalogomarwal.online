import { createSignal, createResource, For, Show } from 'solid-js';
import { obtenerOrdenesTrabajo } from '@/services/ordenTrabajo.service';
import ModalDetalleOrdenTrabajo from './ModalDetalleOrdenTrabajo';
import { formatearPrecio } from '@/utils/formato';

export default function ModalOrdenesPendientes(props: { onCerrar: () => void }) {
  const hoy = new Date().toISOString().split('T')[0];
  const [ordenes] = createResource(
    () => ({ desde: hoy }),
    obtenerOrdenesTrabajo
  );
  const [ordenDetalle, setOrdenDetalle] = createSignal<any | null>(null);

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
  <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-gray-200 flex flex-col">
    <h2 class="text-2xl font-bold mb-6 text-gray-800 tracking-tight">
      Órdenes de Trabajo Pendientes
    </h2>
    <button
      onClick={props.onCerrar}
      class="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold transition"
      title="Cerrar"
    >
      ×
    </button>

    <Show when={ordenes.loading}>
      <div class="text-center text-gray-400 py-10">Cargando...</div>
    </Show>
    <Show when={ordenes.error}>
      <div class="text-red-600">Error al cargar órdenes</div>
    </Show>
    <Show when={ordenes() && ordenes().data?.length === 0}>
      <div class="text-center text-gray-400 py-10">No hay órdenes pendientes</div>
    </Show>
    <Show when={ordenes() && ordenes().data?.length > 0}>
      <div class="overflow-x-auto max-h-72">
        <table class="w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr class="bg-gray-100 text-gray-700">
              <th class="p-3 font-semibold">Fecha</th>
              <th class="p-3 font-semibold">Planta</th>
              <th class="p-3 font-semibold">Turno</th>
              <th class="p-3 font-semibold">Usuario</th>
              <th class="p-3 font-semibold text-right">Total ($)</th>
              <th class="p-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <For each={ordenes().data}>
              {(orden) => (
                <tr class="bg-white hover:bg-blue-50 transition border border-gray-100 rounded">
                  <td class="p-3">{orden.fecha}</td>
                  <td class="p-3">{orden.planta?.nombre ?? '-'}</td>
                  <td class="p-3">{orden.turno}</td>
                  <td class="p-3">{orden.usuario?.nombre ?? '-'}</td>
                  <td class="p-3 text-right">$
                    {orden.productos
                      ? orden.productos.reduce(
                          (acc: any, item: any) =>
                            acc +
                            (item.cantidad && item.producto?.precioUnitario
                              ? item.cantidad * item.producto.precioUnitario
                              : 0),
                          0
                        ).toLocaleString("es-AR")
                      : "-"}
                  </td>
                  <td class="p-3 text-center">
                    <button
                      class="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1 font-medium text-xs shadow transition"
                      onClick={() => setOrdenDetalle(orden)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </Show>

    <Show when={!!ordenDetalle()}>
      <ModalDetalleOrdenTrabajo
        orden={ordenDetalle()}
        onCerrar={() => setOrdenDetalle(null)}
      />
    </Show>
  </div>
</div>
  );
}
