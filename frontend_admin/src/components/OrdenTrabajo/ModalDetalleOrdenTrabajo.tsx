import { For, Show } from 'solid-js';
import { formatearPrecio } from '@/utils/formato';

export default function ModalDetalleOrdenTrabajo(props: { orden: any; onCerrar: () => void }) {
  const orden = props.orden;
  // Calcula total
  const total = () =>
    orden.productos
      ? orden.productos.reduce(
          (acc: any, item: any) =>
            acc +
            (item.cantidad && item.producto?.precioUnitario
              ? item.cantidad * item.producto.precioUnitario
              : 0),
          0
        )
      : 0;

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-300 flex flex-col">
        <h2 class="text-xl font-bold mb-2">Detalle de Orden de Trabajo</h2>
        <button
          onClick={props.onCerrar}
          class="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-lg"
          title="Cerrar"
        >
          ×
        </button>
        <div class="mb-3"><b>Fecha:</b> {orden.fecha}</div>
        <div class="mb-3"><b>Planta:</b> {orden.planta?.nombre ?? '-'}</div>
        <div class="mb-3"><b>Turno:</b> {orden.turno}</div>
        <div class="mb-3"><b>Notas:</b> {orden.nota ?? '-'}</div>

        <div class="mt-2 mb-4">
          <table class="w-full border text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2">Producto</th>
                <th class="p-2">Cantidad</th>
                <th class="p-2 text-right">Precio Unitario</th>
                <th class="p-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <For each={orden.productos}>
                {(item) => (
                  <tr>
                    <td class="p-2">{item.producto?.nombre ?? '-'}</td>
                    <td class="p-2">{item.cantidad}</td>
                    <td class="p-2 text-right">
                      {item.producto?.precioUnitario
                        ? formatearPrecio(item.producto.precioUnitario)
                        : "-"}
                    </td>
                    <td class="p-2 text-right">
                      {item.cantidad && item.producto?.precioUnitario
                        ? formatearPrecio(item.cantidad * item.producto.precioUnitario)
                        : "-"}
                    </td>
                  </tr>
                )}
              </For>
              <tr>
                <td class="p-2 font-bold" colSpan={3}>Total</td>
                <td class="p-2 text-right font-bold">
                  {formatearPrecio(total())}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <button
            onClick={props.onCerrar}
            class="px-4 py-2 border rounded text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
