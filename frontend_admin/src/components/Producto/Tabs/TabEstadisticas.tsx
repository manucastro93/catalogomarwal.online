import { createResource, Show } from 'solid-js';
import { formatearPrecio } from '../../../utils/formato';
import { obtenerEstadisticasProducto } from '../../../services/estadisticas.service';

export default function TabEstadisticas(props: { productoId: number }) {
  const [estadisticas] = createResource(() =>
    obtenerEstadisticasProducto(props.productoId)
  );

  return (
    <Show when={!estadisticas.loading} fallback={<p class="text-sm text-gray-500">Cargando estadísticas...</p>}>
      <Show
        when={estadisticas() && (
          estadisticas().ventas > 0 ||
          estadisticas().unidadesVendidas > 0 ||
          estadisticas().facturacion > 0 ||
          estadisticas().visitas > 0
        )}
        fallback={<p class="text-sm text-gray-500">Este producto aún no tiene estadísticas registradas.</p>}
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
          <div><strong>Ventas realizadas:</strong> {estadisticas().ventas}</div>
          <div><strong>Unidades vendidas:</strong> {estadisticas().unidadesVendidas}</div>
          <div><strong>Facturación total:</strong> {formatearPrecio(estadisticas().facturacion)}</div>
          <div><strong>Vistas al detalle:</strong> {estadisticas().visitas}</div>
        </div>
      </Show>
    </Show>
  );
}
