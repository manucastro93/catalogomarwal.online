import {
  Show,
  createSignal,
  createEffect,
  onCleanup
} from 'solid-js';
import type { Proveedor } from '@/types/proveedor';
import TabDatosProveedor from './Tabs/TabDatosProveedor';
/*
import TabEstadisticasProveedor from './Tabs/TabEstadisticasProveedor';
import TabHistorialComprasProveedor from './Tabs/TabHistorialComprasProveedor';
import TabObservacionesProveedor from './Tabs/TabObservacionesProveedor';
*/
interface Props {
  proveedor: Proveedor | null;
  onCerrar: () => void;
}

export default function VerProveedorModal(props: Props) {
  const [tab, setTab] = createSignal<'datos' | 'actividad' | 'historial' | 'observaciones'>('datos');

  createEffect(() => {
    if (props.proveedor) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') props.onCerrar();
      };
      window.addEventListener('keydown', handleEscape);

      onCleanup(() => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      });
    }
  });

  const imprimir = () => {
    window.print();
  };

  return (
    <Show when={props.proveedor}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh] scroll-smooth">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold">Proveedor: {props.proveedor?.nombre}</h2>
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
            {(['datos', 'actividad', 'historial', 'observaciones'] as const).map((t) => (
              <button
                class={tab() === t ? 'font-semibold border-b-2 border-blue-600 pb-1 text-blue-600' : 'text-gray-500 hover:text-blue-600'}
                onClick={() => setTab(t)}
              >
                {{
                  datos: 'Datos del proveedor',
                  actividad: 'Actividad y estadísticas',
                  historial: 'Historial de compras',
                  observaciones: 'Observaciones'
                }[t]}
              </button>
            ))}
          </div>

          <Show when={tab() === 'datos'}>
            <TabDatosProveedor proveedor={props.proveedor!} />
          </Show>
          {/* 
          <Show when={tab() === 'actividad'}>
            <TabEstadisticasProveedor proveedorId={props.proveedor!.id} />
          </Show>
          <Show when={tab() === 'historial'}>
            <TabHistorialComprasProveedor proveedorId={props.proveedor!.id} />
          </Show>
          <Show when={tab() === 'observaciones'}>
            <TabObservacionesProveedor proveedor={props.proveedor!} />
          </Show>
          */}
        </div>
      </div>
    </Show>
  );
}
