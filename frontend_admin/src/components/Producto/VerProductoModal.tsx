import { For, Show, createSignal, createResource } from 'solid-js';
import type { Producto } from '../../types/producto';
import { formatearPrecio } from '../../utils/formato';
import { obtenerEstadisticasProducto } from '../../services/estadisticas.service';

export default function VerProductoModal(props: {
  producto: Producto | null;
  onCerrar: () => void;
}) {
  const [tab, setTab] = createSignal<'detalles' | 'estadisticas' | 'imagenes'>('detalles');
  const link: string = import.meta.env.VITE_BACKEND_URL;

  const [estadisticas] = createResource(() =>
    props.producto?.id ? obtenerEstadisticasProducto(props.producto.id) : null
  );

  return (
    <Show when={props.producto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow max-w-3xl w-full">
          <h2 class="text-xl font-bold mb-4">{props.producto?.nombre || 'Producto'}</h2>

          <div class="flex gap-4 border-b mb-4">
            <button
              class={`pb-2 cursor-pointer ${tab() === 'detalles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('detalles')}
            >
              Detalles
            </button>
            <button
              class={`pb-2 cursor-pointer ${tab() === 'estadisticas' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('estadisticas')}
            >
              Estadísticas
            </button>
            <button
              class={`pb-2 cursor-pointer ${tab() === 'imagenes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('imagenes')}
            >
              Imágenes
            </button>
          </div>

          <Show when={tab() === 'detalles'}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>SKU:</strong> {props.producto?.sku}</div>
              <div><strong>Categoría:</strong> {props.producto?.Categoria?.nombre || '—'}</div>
              <div class="md:col-span-2"><strong>Descripción:</strong> {props.producto?.descripcion || 'No tiene.'}</div>
              <div><strong>Activo:</strong> {props.producto?.activo ? 'Sí' : 'No'}</div>
              <div><strong>Precio unitario:</strong> {formatearPrecio(props.producto?.precioUnitario)}</div>
              <div><strong>Precio por bulto:</strong>{" "}{props.producto?.precioPorBulto != null? formatearPrecio(props.producto.precioPorBulto): '—'}</div>
              <div><strong>Unidades por bulto:</strong> {props.producto?.unidadPorBulto ?? '—'}</div>
            </div>
          </Show>

          <Show when={tab() === 'estadisticas'}>
          <Show when={!estadisticas.loading} fallback={<p class="text-sm text-gray-500">Cargando estadísticas...</p>}>
  <Show
    when={estadisticas() && (
      estadisticas().ventas > 0 ||
      estadisticas().unidadesVendidas > 0 ||
      estadisticas().facturacion > 0
    )}
    fallback={<p class="text-sm text-gray-500">Este producto aún no tiene estadísticas registradas.</p>}
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
      <div><strong>Ventas realizadas:</strong> {estadisticas().ventas}</div>
      <div><strong>Unidades vendidas:</strong> {estadisticas().unidadesVendidas}</div>
      <div><strong>Facturación total:</strong> {formatearPrecio(estadisticas().facturacion)}</div>
    </div>
  </Show>
</Show>

          </Show>

          <Show when={tab() === 'imagenes'}>
            <Show
              when={Array.isArray(props.producto?.Imagenes) && props.producto.Imagenes.length > 0}
              fallback={<p class="text-sm text-gray-600">Este producto no tiene imágenes cargadas.</p>}
            >
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <For each={props.producto?.Imagenes ?? []}>
                  {(img) => (
                    <img
                      src={link + img.url}
                      alt="imagen"
                      class="rounded w-full h-32 object-cover border"
                      loading="lazy"
                    />
                  )}
                </For>
              </div>
            </Show>
          </Show>

          <div class="text-right mt-6">
            <button
              onClick={props.onCerrar}
              class="bg-gray-400 text-white px-4 py-1 rounded cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
