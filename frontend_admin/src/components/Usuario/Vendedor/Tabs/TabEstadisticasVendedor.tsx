import { createResource, Show, For } from 'solid-js';
import { obtenerEstadisticasVendedor } from '../../../../services/estadisticas.service';
import { formatearPrecio } from '../../../../utils/formato';

interface Props {
  usuarioId: number;
}

export default function TabEstadisticasVendedor({ usuarioId }: Props) { 
  const [data] = createResource(() => obtenerEstadisticasVendedor(usuarioId));

  return (
    <Show when={data()} fallback={<p class="text-sm text-gray-500">Cargando estadísticas...</p>}>
      <div class="space-y-6 text-sm text-gray-800">
        <div>
          <strong>Total de pedidos:</strong> {data()?.totalPedidos ?? 0}
        </div>
        <div>
          <strong>Facturación total:</strong> {formatearPrecio(data()?.totalFacturado ?? 0)}
        </div>
        <div>
          <strong>Producto más vendido:</strong> {data()?.productoTop?.producto?.nombre || '—'} ({data()?.productoTop?.totalVendidas ?? 0} unidades)
        </div>
        <div>
          <strong>Cantidad de clientes:</strong> {data()?.cantidadClientes ?? 0}
        </div>
        <div>
          <strong>Visitas al catálogo por sus clientes:</strong> {data()?.visitasCatalogo ?? 0}
        </div>

        <div>
          <h4 class="font-semibold mt-4">Clientes (ubicación):</h4>
          <Show when={(data()?.clientes?.length ?? 0) > 0} fallback={<p class="text-sm text-gray-600">Este vendedor aún no tiene clientes asignados.</p>}>
            <ul class="list-disc ml-5">
              <For each={data()?.clientes}>
                {(cliente) => (
                  <li>
                    {cliente.nombre} — {cliente.localidad?.nombre || '-'}, {cliente.provincia?.nombre || '-'}
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </div>
    </Show>
  );
}
