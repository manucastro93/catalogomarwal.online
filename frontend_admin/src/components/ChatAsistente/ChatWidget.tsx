import { createSignal, Show } from "solid-js";
import { MessageCircle } from "lucide-solid";
import ChatBox from "./ChatBox";

export default function ChatWidget() {
  const [abierto, setAbierto] = createSignal(false);
  const [notificacion, setNotificacion] = createSignal(false);

  // 🟢 callback que el ChatBox llama cuando hay nueva respuesta
  const manejarNuevaRespuesta = () => {
    if (!abierto()) setNotificacion(true);
  };

  const toggle = () => {
    setAbierto(!abierto());
    if (notificacion()) setNotificacion(false); // limpia notificación al abrir
  };

  return (
    <>
      <div class="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggle}
          class="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg relative"
        >
          <MessageCircle size={24} />
          <Show when={notificacion()}>
            <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-ping" />
            <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
          </Show>
        </button>
      </div>

      <Show when={abierto()}>
        <div class="fixed bottom-20 right-4 z-50 w-96 max-w-full">
          <ChatBox onNuevaRespuesta={manejarNuevaRespuesta} />
        </div>
      </Show>
    </>
  );
}
