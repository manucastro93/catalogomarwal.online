import { createResource, For, Show } from 'solid-js';
import { obtenerComposicionesPorProducto } from '@/services/composicion.service';
import { formatearPrecio } from '@/utils/formato';

export default function TabComposicion(props: { productoId: number }) {
  const [composiciones] = createResource(() =>
    obtenerComposicionesPorProducto(props.productoId)
  );

  return (
    <div>
      <h3 class="text-lg font-semibold mb-4">Composición del producto</h3>

      <Show when={!composiciones.loading} fallback={<p>Cargando composición...</p>}>
        <Show when={composiciones()?.length}>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse rounded-lg shadow-sm">
              <thead>
                <tr class="bg-gray-100 text-gray-700 sticky top-0">
                  <th class="px-3 py-2 text-left">SKU</th>
                  <th class="px-3 py-2 text-left">Descripción</th>
                  <th class="px-3 py-2 text-left">Proveedor</th>
                  <th class="px-3 py-2 text-center">Costo</th>
                  <th class="px-3 py-2 text-center">Unidad</th>
                  <th class="px-3 py-2 text-center">Cantidad</th>
                  <th class="px-3 py-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <For each={composiciones()}>
                  {(item) => (
                    <tr class="odd:bg-white even:bg-gray-50 hover:bg-red-50 transition text-xs">
                      <td class="px-3 py-2 font-mono">{item.MateriaPrima?.sku || '-'}</td>
                      <td class="px-3 py-2">{item.MateriaPrima?.nombre || '-'}</td>
                      <td class="px-3 py-2">{item.MateriaPrima?.Proveedor?.nombre || '-'}</td>
                      <td class="px-3 py-2 text-center">{formatearPrecio(item.MateriaPrima?.costoDux || 0)}</td>
                      <td class="px-3 py-2 text-center">{item.unidad || item.MateriaPrima?.unidadMedida || '-'}</td>
                      <td class="px-3 py-2 text-center">{item.cantidad}</td>
                      <td class="px-3 py-2 text-center">
                        {formatearPrecio((item.MateriaPrima?.costoDux || 0) * item.cantidad)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
              <tfoot>
                <tr class="font-bold bg-gray-100 text-sm">
                  <td colspan="6" class="text-right pr-4">Total composición:</td>
                  <td class="text-center">
                    {formatearPrecio(
                      composiciones()?.reduce((acc, item) => {
                        return acc + (item.MateriaPrima?.costoDux || 0) * item.cantidad;
                      }, 0) || 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Show>

        <Show when={!composiciones() || composiciones()?.length === 0}>
          <div class="text-gray-500 p-4">Este producto no tiene composición asignada.</div>
        </Show>
      </Show>
    </div>
  );
}
