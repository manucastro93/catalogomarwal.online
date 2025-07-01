import { createResource, For, Show } from 'solid-js';
import { obtenerComposicionesPorProducto } from '@/services/composicion.service';

export default function TabComposicion(props: { productoId: number }) {
  const [composiciones] = createResource(() =>
    obtenerComposicionesPorProducto(props.productoId)
  );

  return (
    <div>
      <h3 class="text-lg font-semibold mb-2">Composición del producto</h3>
      <Show when={!composiciones.loading} fallback={<p>Cargando composición...</p>}>
        <Show when={composiciones()?.length}>
          <table class="min-w-full text-sm border rounded">
            <thead>
              <tr>
                <th class="px-2 py-1 border-b">Materia Prima</th>
                <th class="px-2 py-1 border-b">Cantidad</th>
                <th class="px-2 py-1 border-b">Unidad</th>
                <th class="px-2 py-1 border-b">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <For each={composiciones()}>
                {(c) => (
                  <tr>
                    <td class="px-2 py-1 border-b">{c.MateriaPrima?.nombre || `ID ${c.materiaPrimaId}`}</td>
                    <td class="px-2 py-1 border-b">{c.cantidad}</td>
                    <td class="px-2 py-1 border-b">{c.unidad}</td>
                    <td class="px-2 py-1 border-b">{c.detalle || '—'}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
        <Show when={!composiciones() || !composiciones()?.length}>
          <div class="text-gray-500 p-4">Este producto no tiene composición asignada.</div>
        </Show>
      </Show>
    </div>
  );
}
