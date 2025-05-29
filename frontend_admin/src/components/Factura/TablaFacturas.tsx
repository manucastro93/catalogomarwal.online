import { For } from 'solid-js';
import type { FacturaDux } from '@/types/factura';

interface Props {
  facturas: FacturaDux[];
  orden: string;
  direccion: 'asc' | 'desc';
  onOrdenar: (col: string) => void;
}

export default function TablaFacturas({ facturas, orden, direccion, onOrdenar }: Props) {
  const renderOrden = (col: string) =>
    orden === col ? (direccion === 'asc' ? '▲' : '▼') : '';

  return (
    <div class="overflow-x-auto rounded border border-gray-200">
      <table class="min-w-full divide-y divide-gray-200 text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th onClick={() => onOrdenar('id')} class="cursor-pointer px-4 py-2">ID {renderOrden('id')}</th>
            <th onClick={() => onOrdenar('fecha_comp')} class="cursor-pointer px-4 py-2">Fecha {renderOrden('fecha_comp')}</th>
            <th class="px-4 py-2">Cliente</th>
            <th class="px-4 py-2">Vendedor</th>
            <th class="px-4 py-2">Comprobante</th>
            <th class="px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          <For each={facturas}>
            {f => (
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">{f.id}</td>
                <td class="px-4 py-2">{new Date(f.fecha_comp).toLocaleDateString()}</td>
                <td class="px-4 py-2">{f.apellido_razon_soc} {f.nombre}</td>
                <td class="px-4 py-2">{f.personal}</td>
                <td class="px-4 py-2">{f.tipo_comp} {f.letra_comp} {f.nro_comp}</td>
                <td class="px-4 py-2">${f.total.toFixed(2)}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
