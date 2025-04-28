import { createSignal, Show } from 'solid-js';
import type { Usuario } from '@/types/usuario';
import TabEstadisticasVendedor from './Tabs/TabEstadisticasVendedor';
import TabDetallesVendedor from './Tabs/TabDetallesVendedor';

interface Props {
  abierto: boolean;
  usuario: Usuario | null;
  onCerrar: () => void;
}

export default function ModalVerVendedor(props: Props) {
  const [tab, setTab] = createSignal<'detalles' | 'estadisticas'>('detalles');

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            {props.usuario ? 'Detalles del Vendedor' : ''}
          </h2>

          <div class="flex gap-4 mb-4 border-b">
            <button
              class={`pb-2 cursor-pointer ${tab() === 'detalles' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('detalles')}
            >
              Detalles
            </button>
            <button
              class={`pb-2 cursor-pointer ${tab() === 'estadisticas' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('estadisticas')}
            >
              Estadísticas
            </button>
          </div>

          <Show when={tab() === 'detalles' && props.usuario}>
            <TabDetallesVendedor usuario={props.usuario!} />
          </Show>

          <Show when={tab() === 'estadisticas' && props.usuario}>
            <TabEstadisticasVendedor usuarioId={props.usuario!.id} />
          </Show>

          <div class="text-right mt-6">
            <button
              onClick={props.onCerrar}
              class="bg-gray-300 px-4 py-1 rounded cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
