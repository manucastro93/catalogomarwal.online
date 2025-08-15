import { createSignal, Show } from 'solid-js';
import type { Producto } from '@/types/producto';
import TabDetalles from './TabDatos';
import TabEstadisticas from '../Tabs/TabEstadisticas';
import TabImagenes from '../Tabs/TabImagenes';

export default function VerProductoModal(props: {
  producto: Producto | null;
  onCerrar: () => void;
}) {
  const [tab, setTab] = createSignal<'detalles' | 'estadisticas' | 'imagenes'>('detalles');

  return (
    <Show when={props.producto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded shadow-xl w-full max-w-6xl h-[90vh] overflow-y-auto relative">
          <h2 class="text-xl font-bold mb-4">
            {props.producto?.nombre || 'Producto'}
          </h2>

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
            <TabDetalles producto={props.producto!} />
          </Show>

          <Show when={tab() === 'estadisticas'}>
            <TabEstadisticas productoId={props.producto!.id} />
          </Show>

          <Show when={tab() === 'imagenes'}>
            <TabImagenes imagenes={props.producto?.Imagenes || []} />
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