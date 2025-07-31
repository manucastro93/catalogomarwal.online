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
      <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl h-full md:h-[90vh] p-4 md:p-6 border border-gray-300 flex flex-col overflow-y-auto relative">
        <h2 class="text-xl font-bold mb-4">Órdenes de Trabajo Pendientes</h2>
        <button
          onClick={props.onCerrar}
          class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-lg"
          title="Cerrar"
        >
          ×
        </button>
        <Show when={ordenes.loading}>
          <div class="text-center text-gray-500 py-8">Cargando...</div>
        </Show>
        <Show when={ordenes.error}>
          <div class="text-red-600">Error al cargar órdenes</div>
        </Show>
        <Show when={ordenes() && ordenes().data?.length === 0}>
          <div class="text-center text-gray-500 py-8">No hay órdenes pendientes</div>
        </Show>
        <Show when={ordenes() && ordenes().data?.length > 0}>
          <div class="overflow-x-auto">
            <table class="w-full border text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2">Fecha</th>
                  <th class="p-2">Planta</th>
                  <th class="p-2">Turno</th>
                  <th class="p-2">Usuario</th>
                  <th class="p-2 text-right">Total ($)</th>
                  <th class="p-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <For each={ordenes().data}>
                  {(orden) => (
                    <tr class="border-t">
                      <td class="p-2">{orden.fecha}</td>
                      <td class="p-2">{orden.planta?.nombre ?? '-'}</td>
                      <td class="p-2">{orden.turno}</td>
                      <td class="p-2">{orden.usuario?.nombre ?? '-'}</td>
                      <td class="p-2 text-right">$
                        {orden.productos
                          ? formatearPrecio(orden.productos.reduce(
                              (acc: any, item: any) =>
                                acc +
                                (item.cantidad && item.producto?.precioUnitario
                                  ? item.cantidad * item.producto.precioUnitario
                                  : 0),
                              0
                            ))
                          : "-"}
                      </td>
                      <td class="p-2 text-right">
                        <button
                          class="text-blue-600 underline"
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
