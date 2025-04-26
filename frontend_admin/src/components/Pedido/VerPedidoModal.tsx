import { Show, For } from "solid-js";
import type { Pedido } from "../../types/pedido";
import { formatearPrecio } from "../../utils/formato";

export default function VerPedidoModal(props: {
  pedido: Pedido | null;
  onClose: () => void;
}) {
  const imprimir = () => {
    const contenido = document.getElementById("contenido-a-imprimir");
    if (!contenido) return;

    const ventana = window.open("", "_blank", "width=800,height=600");
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

    ventana.onload = () => {
      ventana.focus();
      ventana.print();
      ventana.close();
    };
  };

  const isEditing = props.pedido?.estadoEdicion === true;

  return (
    <Show when={props.pedido != null}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Pedido #{props.pedido!.id}</h2>
            <button
              class="text-gray-600 hover:text-black text-2xl leading-none"
              onClick={props.onClose}
            >
              ×
            </button>
          </div>

          <Show when={isEditing}>
            <div class="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded">
              ⚠️ <strong>Pedido en edición por el cliente.</strong> No se puede modificar el estado hasta que finalice o expire (30 minutos).
            </div>
          </Show>

          <div id="contenido-a-imprimir" class="space-y-4">
            <div>
              <strong>Cliente:</strong> {props.pedido!.cliente?.nombre} (
              {props.pedido!.cliente?.email})
            </div>
            <div>
              <strong>Vendedor:</strong> {props.pedido!.usuario?.nombre || "—"}
            </div>
            <div>
              <strong>Estado:</strong> {props.pedido!.estadoPedido?.nombre || "—"}
            </div>
            <div>
              <strong>Observaciones:</strong>{" "}
              {props.pedido!.observaciones || "—"}
            </div>
            <div>
              <strong>Fecha:</strong>{" "}
              {new Date(props.pedido!.createdAt).toLocaleString()}
            </div>

            <div>
              <table class="table-auto w-full mt-2 border">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="border px-2 py-1">SKU</th>
                    <th class="border px-2 py-1">Cantidad</th>
                    <th class="border px-2 py-1">Precio xUn</th>
                    <th class="border px-2 py-1">Precio xBulto</th>
                    <th class="border px-2 py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={props.pedido!.detalles}>
                    {(detalle) => (
                      <tr>
                        <td class="border px-2 py-1">
                          <div class="font-semibold">
                            {detalle.producto?.nombre || "—"}
                          </div>
                          <div class="text-xs text-gray-500">
                            SKU: {detalle.producto?.sku || "—"}
                          </div>
                        </td>
                        <td class="border px-2 py-1">{detalle.cantidad}</td>
                        <td class="border px-2 py-1">
                          {formatearPrecio(detalle.precioUnitario)}
                        </td>
                        <td class="border px-2 py-1">
                          {formatearPrecio(detalle.precioXBulto)}
                        </td>
                        <td class="border px-2 py-1">
                          {formatearPrecio((detalle.precioXBulto ?? 0) * detalle.cantidad)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-4 font-bold text-lg">
            <strong>Total:</strong> {formatearPrecio(props.pedido!.total)}
          </div>

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
