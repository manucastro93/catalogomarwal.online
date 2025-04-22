import {
  Show,
  createSignal,
  createEffect,
  onCleanup
} from 'solid-js';
import type { Cliente } from '../../types/cliente';
import TabEstadisticasCliente from './Tabs/TabEstadisticas';
import TabDatosCliente from './Tabs/TabDetalles';
import TabHistorialCliente from './Tabs/Historial'; 

interface Props {
  cliente: Cliente | null;
  onCerrar: () => void;
}

export default function VerClienteModal(props: Props) {
  const [tab, setTab] = createSignal<'datos' | 'actividad' | 'historial'>('datos');

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') props.onCerrar();
  };

  createEffect(() => {
    if (props.cliente) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleEscape);
  });

  const imprimir = () => {
    window.print();
  };

  return (
    <Show when={props.cliente}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">Cliente: {props.cliente?.nombre}</h2>
            <div class="flex gap-2">
              <button
                onClick={imprimir}
                class="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 text-sm"
              >
                Imprimir
              </button>
              <button
                onClick={props.onCerrar}
                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div class="mb-6 border-b pb-2 flex gap-6 text-base font-medium">
            <button
              class={tab() === 'datos' ? 'font-semibold border-b-2 border-blue-600 pb-1' : ''}
              onClick={() => setTab('datos')}
            >
              Datos del cliente
            </button>
            <button
              class={tab() === 'actividad' ? 'font-semibold border-b-2 border-blue-600 pb-1' : ''}
              onClick={() => setTab('actividad')}
            >
              Actividad y estadísticas
            </button>
            <button
              class={tab() === 'historial' ? 'font-semibold border-b-2 border-blue-600 pb-1' : ''}
              onClick={() => setTab('historial')}
            >
              Historial de datos
            </button>
          </div>

          <Show when={tab() === 'datos'}>
            <TabDatosCliente cliente={props.cliente!} />
          </Show>

          <Show when={tab() === 'actividad'}>
            <TabEstadisticasCliente clienteId={props.cliente!.id} />
          </Show>

          <Show when={tab() === 'historial'}>
            <TabHistorialCliente clienteId={props.cliente!.id} />
          </Show>
        </div>
      </div>
    </Show>
  );
}
