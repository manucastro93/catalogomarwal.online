import { createSignal, createEffect, Show } from 'solid-js';
import type { Vendedor } from '../../types/vendedor';

export default function ModalVerVendedor(props: {
  abierto: boolean;
  vendedor?: Vendedor | null;
  onCerrar: () => void;
}) {
  const [tab, setTab] = createSignal<'detalles' | 'estadisticas'>('detalles');

  createEffect(() => {
    // Lógica para actualizar las señales si es necesario
  });

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow w-full max-w-2xl">
          <h2 class="text-xl font-bold mb-4">
            {props.vendedor ? 'Detalles del Vendedor' : 'Nuevo Vendedor'}
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

          <Show when={tab() === 'detalles'}>
            <div class="space-y-3">
              <div>
                <span class='font-bold'>Nombre: </span>{props.vendedor?.nombre}
              </div>
              <div>
                <span class='font-bold'>Email: </span>{props.vendedor?.email}
              </div>
              <div>
                <span class='font-bold'>Teléfono: </span>{props.vendedor?.telefono || '-'}
              </div>
            </div>
          </Show>

          <Show when={tab() === 'estadisticas'}>
            <div class="space-y-4">
              <div>
                <span class='font-bold'>Ventas Totales: </span>{props.vendedor?.ventasTotales || 'No disponible'}
              </div>
              <div>
                <span class='font-bold'>Clientes Atendidos: </span>{props.vendedor?.clientesAtendidos || 'No disponible'}
              </div>
              <div>
                <span class='font-bold'>Fecha de Registro: </span>{props.vendedor?.fechaRegistro || 'No disponible'}
              </div>
            </div>
          </Show>

          <div class="text-right mt-6">
            <button onClick={props.onCerrar} class="bg-gray-300 px-4 py-1 rounded cursor-pointer">Cerrar</button>
          </div>
        </div>
      </div>
    </Show>
  );
}
