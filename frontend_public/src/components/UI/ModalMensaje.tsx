import { Show, For } from "solid-js";

export default function ModalMensaje(props: {
  mensaje: string;
  errores?: { nombre?: string; motivo: string }[];
  cerrar: () => void;
  titulo?: string;
  tipo?: "error" | "info" | "ok";
  notaFinal?: string;
}) {
  const tipo = props.tipo || "info";

  const colores = {
    error: "bg-red-100 border-red-500 text-red-800",
    info: "bg-blue-100 border-blue-500 text-blue-800",
    ok: "bg-green-100 border-green-500 text-green-800",
  };

  const iconos = {
    error: "❌",
    info: "ℹ️",
    ok: "✅",
  };

  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div
        class={`border rounded-lg max-w-md w-full p-6 shadow-lg bg-white ${colores[tipo]}`}
      >
        <div class="flex items-start gap-3 mb-4">
          <div class="text-2xl">{iconos[tipo]}</div>
          <div class="flex-1">
            <Show when={props.titulo}>
              <h2 class="font-bold text-lg mb-2">{props.titulo}</h2>
            </Show>
            <p class="text-sm mb-2 whitespace-pre-line">{props.mensaje}</p>
            <Show when={props.errores?.length}>
              <div class="max-h-40 overflow-auto pr-1">
                <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <For each={props.errores}>
                    {(err) => (
                      <li>
                        <span class="font-medium">
                          {err.nombre || "Producto"}:
                        </span>{" "}
                        {err.motivo}
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </Show>
            <Show when={props.notaFinal}>
  <p class="text-sm text-gray-600 mt-4 whitespace-pre-line">
    {props.notaFinal}
  </p>
</Show>

          </div>
        </div>
        <div class="text-right">
          <button
            onClick={props.cerrar}
            class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
