import { createResource, Show, For } from 'solid-js';
import { obtenerEstadisticasVendedor } from '../../../services/estadisticas.service';
import { formatearPrecio } from '../../../utils/formato';

export default function TabEstadisticasVendedor(props: { vendedorId: number }) {
  const [data] = createResource(() => obtenerEstadisticasVendedor(props.vendedorId));

  return (
    <Show when={!data.loading} fallback={<p class="text-sm text-gray-500">Cargando estadísticas...</p>}>
      <div class="space-y-6 text-sm text-gray-800">
        <div>
          <strong>Total de pedidos:</strong> {data().totalPedidos}
        </div>
        <div>
          <strong>Facturación total:</strong> {formatearPrecio(data().totalFacturado)}
        </div>
        <div>
          <strong>Producto más vendido:</strong> {data().productoTop?.producto?.nombre || '—'} ({data().productoTop?.totalVendidas || 0} unidades)
        </div>
        <div>
          <strong>Cantidad de clientes:</strong> {data().cantidadClientes}
        </div>
        <div>
          <strong>Visitas al catálogo por sus clientes:</strong> {data().visitasCatalogo || 0}
        </div>

        <div>
          <h4 class="font-semibold mt-4">Clientes (ubicación):</h4>
          <Show when={data().clientes.length > 0} fallback={<p class="text-sm text-gray-600">Este vendedor aún no tiene clientes asignados.</p>}>
            <ul class="list-disc ml-5">
              <For each={data().clientes}>{(cliente) => (
                <li>
                  {cliente.nombre} — {cliente.localidad?.nombre || '-'}, {cliente.provincia?.nombre || '-'}
                </li>
              )}</For>
            </ul>
          </Show>
        </div>
      </div>
    </Show>
  );
}