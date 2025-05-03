import { createSignal, For, Show, onCleanup } from "solid-js";
import { preguntarAlAsistente } from "@/services/chat.service";

interface Mensaje {
  emisor: "usuario" | "asistente";
  texto: string;
  acciones?: { texto: string; url: string }[];
}

interface Props {
    onNuevaRespuesta?: () => void;
  }

  export default function ChatBox(props: Props) {
  const [mensaje, setMensaje] = createSignal("");
  const [historial, setHistorial] = createSignal<Mensaje[]>([]);
  let contenedor: HTMLDivElement | undefined;

  const enviar = async () => {
    const texto = mensaje().trim();
    if (!texto) return;

    setHistorial([...historial(), { emisor: "usuario", texto }]);

    const { respuesta, acciones } = await preguntarAlAsistente(texto);
    setHistorial((prev) => [...prev, { emisor: "asistente", texto: respuesta, acciones }]);

    props.onNuevaRespuesta?.(); // 🔴 notificamos nueva respuesta
    setMensaje("");
  };

  const scrollBottom = () => {
    if (contenedor) contenedor.scrollTop = contenedor.scrollHeight;
  };

  const observer = new MutationObserver(scrollBottom);
  onCleanup(() => observer.disconnect());

  setTimeout(() => {
    if (contenedor) {
      observer.observe(contenedor, { childList: true, subtree: true });
    }
  }, 100);

  return (
    <div class="bg-white rounded-xl shadow-xl p-4 border border-gray-200 h-96 flex flex-col">
      <div ref={contenedor} class="flex-1 overflow-y-auto space-y-2 pr-1">
        <For each={historial()}>
          {(msg) => (
            <div class={`p-2 rounded ${msg.emisor === "usuario" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"}`}>
              <p>{msg.texto}</p>
              <Show when={msg.acciones}>
                <div class="mt-2 space-y-1">
                  <For each={msg.acciones}>
                    {(accion) => (
                      <a
                        href={accion.url}
                        class="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600"
                      >
                        {accion.texto}
                      </a>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="pt-2 flex gap-2">
        <input
          class="flex-1 border rounded px-3 py-2 text-sm"
          type="text"
          placeholder="Escribí tu pregunta..."
          value={mensaje()}
          onInput={(e) => setMensaje(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <button onClick={enviar} class="bg-green-600 text-white px-3 rounded hover:bg-green-700 text-sm">
          Enviar
        </button>
      </div>
    </div>
  );
}
