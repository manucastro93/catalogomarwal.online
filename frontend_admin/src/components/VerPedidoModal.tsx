import { Show, For } from 'solid-js';
import type { Pedido } from '../shared/types/pedido';

export default function VerPedidoModal(props: {
  pedido: Pedido | null;
  onClose: () => void;
}) {

  const imprimir = () => {
    const contenido = document.getElementById('contenido-a-imprimir');
    if (!contenido) return;
  
    const ventana = window.open('', '_blank', 'width=800,height=600');
    if (!ventana) return;
  
    ventana.document.open();
    ventana.document.write(`
      <html>
        <head>
          <title>Pedido #${props.pedido!.id}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${contenido.innerHTML}
        </body>
      </html>
    `);
    ventana.document.close();
  
    // Esperar un poquito para asegurar que se cargue todo antes de imprimir
    ventana.onload = () => {
      ventana.focus();
      ventana.print();
      ventana.close();
    };
  };
  

  return (
    <Show when={props.pedido}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Pedido #{props.pedido!.id}</h2>
            <button class="text-gray-600 hover:text-black text-2xl leading-none" onClick={props.onClose}>×</button>
          </div>

          {/* CONTENIDO A IMPRIMIR */}
          <div id="contenido-a-imprimir" class="space-y-4">
            <div><strong>Cliente:</strong> {props.pedido!.cliente?.nombre} ({props.pedido!.cliente?.email})</div>
            <div><strong>Vendedor:</strong> {props.pedido!.usuario?.nombre || '—'}</div>
            <div><strong>Estado:</strong> {props.pedido!.estado}</div>
            <div><strong>Observaciones:</strong> {props.pedido!.observaciones || '—'}</div>
            <div><strong>Total:</strong> ${props.pedido!.total?.toFixed(2)}</div>
            <div><strong>Fecha:</strong> {new Date(props.pedido!.createdAt).toLocaleString()}</div>

            <div>
              <strong>Productos:</strong>
              <table class="table-auto w-full mt-2 border">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="border px-2 py-1">Producto</th>
                    <th class="border px-2 py-1">Cantidad</th>
                    <th class="border px-2 py-1">Precio unitario</th>
                    <th class="border px-2 py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={props.pedido!.detalles}>
                    {(detalle) => (
                      <tr>
                        <td class="border px-2 py-1">{detalle.producto?.nombre || '—'}</td>
                        <td class="border px-2 py-1">{detalle.cantidad}</td>
                        <td class="border px-2 py-1">${detalle.precioUnitario.toFixed(2)}</td>
                        <td class="border px-2 py-1">
                          ${(detalle.precioUnitario * detalle.cantidad).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTONES */}
          <div class="mt-6 flex justify-end gap-2">
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={imprimir}
            >
              Imprimir
            </button>
            <button
              class="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              onClick={props.onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
