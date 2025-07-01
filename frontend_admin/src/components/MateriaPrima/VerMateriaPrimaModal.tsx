import { createSignal, Show } from 'solid-js';
import type { MateriaPrima } from '@/types/materiaPrima';
import TabDetalles from './Tabs/TabDetalles';

export default function VerMateriaPrimaModal(props: {
  materiaPrima: MateriaPrima | null;
  onCerrar: () => void;
}) {
  const [tab, setTab] = createSignal<'detalles'>('detalles');

  return (
    <Show when={props.materiaPrima}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow max-w-3xl w-full">
          <h2 class="text-xl font-bold mb-4">
            {props.materiaPrima?.nombre || 'Materia Prima'}
          </h2>

          <div class="flex gap-4 border-b mb-4">
            <button
              class={`pb-2 cursor-pointer ${tab() === 'detalles' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('detalles')}
            >
              Detalles
            </button>
          </div>

          <Show when={tab() === 'detalles'}>
            <TabDetalles materiaPrima={props.materiaPrima!} />
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
