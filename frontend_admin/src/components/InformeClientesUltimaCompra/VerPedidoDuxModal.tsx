import { Show, For, createSignal } from "solid-js";
import type { PedidoDux } from "@/types/pedido";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";
import ModalMensaje from "../Layout/ModalMensaje";

export default function VerPedidoDuxModal(props: {
  pedido: PedidoDux | null;
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
          <title>Pedido</title>
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

  const [mensajeExito, setMensajeExito] = createSignal("");

  return (
    <Show when={props.pedido != null}>
      <ModalMensaje mensaje={mensajeExito()} cerrar={() => setMensajeExito("")} />
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">
              Pedido #{props.pedido!.nro_pedido}
              <span class="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                DUX
              </span>
            </h2>
            <button
              class="text-gray-600 hover:text-black text-2xl leading-none"
              onClick={props.onClose}
            >
              ×
            </button>
          </div>

          <div id="contenido-a-imprimir" class="space-y-4">
            <div><strong>Cliente:</strong> {props.pedido!.cliente || "—"}</div>
            <div><strong>Vendedor:</strong> {props.pedido!.personal || "—"}</div>
            <div><strong>Estado:</strong> {props.pedido!.estado_facturacion || "—"}</div>
            <div><strong>Observaciones:</strong> {props.pedido!.observaciones || "—"}</div>
            <div><strong>Fecha:</strong> {formatearFechaCorta(props.pedido!.fecha)}</div>

            <div>
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
                  <For each={props.pedido!.detalles || []}>
                    {(item) => (
                      <tr>
                        <td class="border px-2 py-1">
                          <div class="font-semibold">{item.descripcion}</div>
                          <div class="text-xs text-gray-500">Código: {item.codItem}</div>
                        </td>
                        <td class="border px-2 py-1">{item.cantidad}</td>
                        <td class="border px-2 py-1">{formatearPrecio(item.precioUnitario)}</td>
                        <td class="border px-2 py-1">{formatearPrecio(item.subtotal)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-4 font-bold text-lg">
            <strong>Total:</strong> {formatearPrecio(Number(props.pedido!.total))}
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
