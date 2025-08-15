import { For } from 'solid-js';
import type { FacturaDux } from '@/types/factura';
import { formatearFechaCorta, formatearPrecio } from "@/utils/formato";

interface Props {
  facturas: FacturaDux[];
  orden: string;
  direccion: 'asc' | 'desc';
  onOrdenar: (col: string) => void;
  onVer: (factura: FacturaDux) => void; // 👈 nuevo
}

export default function TablaFacturas({ facturas, orden, direccion, onOrdenar, onVer }: Props) {
  const renderOrden = (col: string) =>
    orden === col ? (direccion === 'asc' ? '▲' : '▼') : '';

  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th onClick={() => onOrdenar('id')} class="cursor-pointer px-4 py-2">ID {renderOrden('id')}</th>
            <th onClick={() => onOrdenar('fecha_comp')} class="cursor-pointer px-4 py-2">Fecha {renderOrden('fecha_comp')}</th>
            <th class="px-4 py-2">Cliente</th>
            <th class="px-4 py-2">Vendedor</th>
            <th class="px-4 py-2">Comprobante</th>
            <th class="px-4 py-2">Total</th>
            <th class="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <For each={facturas}>
            {f => (
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">{f.id}</td>
                <td class="px-4 py-2">{formatearFechaCorta(f.fecha_comp)}</td>
                <td class="px-4 py-2">{f.apellido_razon_soc} {f.nombre}</td>
                <td class="px-4 py-2">{f.personal?.nombre} {f.personal?.apellido_razon_social}</td>
                <td class="px-4 py-2">{f.tipo_comp} {f.letra_comp} {f.nro_comp}</td>
                <td class="px-4 py-2">{formatearPrecio(f.total)}</td>
                <td class="px-4 py-2">
                  <button
                    class="text-blue-600 hover:underline"
                    onClick={() => onVer(f)}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
