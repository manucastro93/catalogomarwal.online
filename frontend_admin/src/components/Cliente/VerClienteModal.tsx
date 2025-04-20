import {
  Show,
  createSignal,
  createEffect,
  onCleanup
} from 'solid-js';
import type { Cliente } from '../../types/cliente';

interface Props {
  cliente: Cliente | null;
  onCerrar: () => void;
}

export default function VerClienteModal(props: Props) {
  const [tab, setTab] = createSignal<'datos' | 'actividad'>('datos');

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') props.onCerrar();
  };

  createEffect(() => {
    if (props.cliente) {
      document.body.style.overflow = 'hidden';
      console.log('Cliente:', props.cliente);
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
        <div
          class="relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-[90vh]"
        >
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
          </div>

          <Show when={tab() === 'datos'}>
            <div class="grid grid-cols-2 gap-6 text-base">
              <div>
                <p class="font-semibold text-gray-700 text-lg">Nombre</p>
                <p>{props.cliente?.nombre || '-'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-700 text-lg">Teléfono</p>
                <p>{props.cliente?.telefono || '-'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-700 text-lg">Email</p>
                <p>{props.cliente?.email || '-'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-700 text-lg">CUIT / CUIL</p>
                <p>{props.cliente?.cuit_cuil || '-'}</p>
              </div>
              <div class="col-span-2">
                <p class="font-semibold text-gray-700 text-lg">Razón social</p>
                <p>{props.cliente?.razonSocial || '-'}</p>
              </div>
              <div class="col-span-2">
                <p class="font-semibold text-gray-700 text-lg">Dirección</p>
                <p>{props.cliente?.direccion || '-'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-700 text-lg">Provincia</p>
                <p>{props.cliente?.provincia?.nombre || '-'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-700 text-lg">Localidad</p>
                <p>{props.cliente?.localidad?.nombre || '-'}</p>
              </div>
              <div class="col-span-2">
                <p class="font-semibold text-gray-700 text-lg">Vendedor asignado</p>
                <p>{props.cliente?.vendedor?.nombre || '-'}</p>
              </div>
              <div class="col-span-2">
                <p class="font-semibold text-gray-700 text-lg">Creado el</p>
                <p>{new Date(props.cliente?.createdAt || '').toLocaleString()}</p>
              </div>
            </div>
          </Show>

          <Show when={tab() === 'actividad'}>
            <div class="text-base text-gray-700">
              <p class="text-gray-500 italic">Próximamente: pedidos recientes, historial de actividad, ingresos mensuales, etc.</p>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
