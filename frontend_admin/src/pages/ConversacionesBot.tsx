import { createSignal, createResource, createMemo, Show, For } from "solid-js";
import { onMount } from "solid-js";
import { obtenerConversacionesAgrupadas } from "@/services/conversacionBot.service";
import api from "@/services/api";
import Loader from "@/components/Layout/Loader";
import type { ConversacionAgrupada } from "@/types/conversacionBot";

export default function ConversacionesBot() {
  const [busqueda, setBusqueda] = createSignal("");
  const [telefonoSeleccionado, setTelefonoSeleccionado] = createSignal<
    string | null
  >(null);

  const [respuesta, { refetch }] = createResource(
    () => ({ buscar: busqueda() }),
    obtenerConversacionesAgrupadas
  );

  const conversacionesFiltradas = createMemo(() =>
    (respuesta()?.data || []).filter((c: ConversacionAgrupada) =>
      c.telefono.includes(busqueda().toLowerCase())
    )
  );

  const seleccionada = createMemo(() =>
    conversacionesFiltradas().find(
      (c: ConversacionAgrupada) => c.telefono === telefonoSeleccionado()
    )
  );

  return (
    <div class="h-[calc(100vh-64px)] flex">
      {/* Lista teléfonos */}
      <div class="w-1/3 border-r border-gray-300 overflow-y-auto p-4 bg-white">
        <input
          type="text"
          placeholder="Buscar teléfono"
          class="border px-2 py-1 rounded w-full mb-4"
          value={busqueda()}
          onInput={(e) => setBusqueda(e.currentTarget.value)}
        />

        <Show when={!respuesta.loading} fallback={<Loader />}>
          <For each={conversacionesFiltradas()}>
            {(c: ConversacionAgrupada) => (
              <div
                class="p-3 border rounded mb-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => setTelefonoSeleccionado(c.telefono)}
              >
                <div class="font-medium text-sm">
                  {c.cliente?.nombre
                    ? `${c.cliente.nombre} - ${
                        c.cliente.razonSocial && c.cliente.razonSocial !== "-"
                          ? c.cliente.razonSocial
                          : "no definida"
                      } (${c.telefono})`
                    : c.telefono}
                </div>
                <div class="text-[11px] text-right text-gray-500">
                  {new Date(
                    c.historial.at(-1)?.createdAt || ""
                  ).toLocaleString()}
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Panel de historial */}
      <div class="flex-1 p-6 overflow-y-auto bg-gray-50">
        <Show
          when={seleccionada()}
          fallback={
            <div class="text-center text-gray-400 mt-20">
              Seleccioná un teléfono para ver el historial
            </div>
          }
        >
          <Historial conversacion={seleccionada()!} onResponder={refetch} />
        </Show>
      </div>
    </div>
  );
}

function Historial(props: {
  conversacion: ConversacionAgrupada;
  onResponder: () => void;
}) {
  let contenedorMensajes: HTMLDivElement | undefined;

  onMount(() => {
    setTimeout(() => {
      contenedorMensajes?.scrollTo({
        top: contenedorMensajes.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  });

  return (
    <div class="flex flex-col h-full max-w-3xl mx-auto">
      <div class="p-4 font-semibold text-lg border-b">
        📱 {props.conversacion.cliente?.nombre} - {props.conversacion.cliente?.razonSocial}
      </div>

      <div
        ref={contenedorMensajes}
        class="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-100"
      >
        <For each={props.conversacion.historial}>
          {(msg: ConversacionAgrupada["historial"][0]) => (
            <div>
              <div class="text-xs text-gray-600">
                {new Date(msg.createdAt).toLocaleString()}
              </div>
              <div class="bg-gray-200 rounded p-2 my-1">
                🧍 {msg.mensajeCliente}
              </div>
              <div class="bg-green-100 rounded p-2">🤖 {msg.respuestaBot}</div>
              <Show when={msg.derivar}>
                <div class="text-[10px] text-red-600">⚠ Derivado</div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <RespuestaInput
        telefono={props.conversacion.telefono}
        onEnviado={props.onResponder}
      />
    </div>
  );
}

function RespuestaInput(props: { telefono: string; onEnviado: () => void }) {
  const [mensaje, setMensaje] = createSignal("");
  const [enviando, setEnviando] = createSignal(false);

  const enviar = async () => {
    if (!mensaje().trim()) return;
    setEnviando(true);

    try {
      await api.post("/conversaciones-bot/responder", {
        telefono: props.telefono,
        mensaje: mensaje(),
      });

      setMensaje("");
      props.onEnviado(); // Refrescar historial
    } catch (e) {
      alert("❌ Error al enviar respuesta");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div class="p-4 border-t bg-white">
      <div class="flex gap-2">
        <input
          type="text"
          placeholder="Escribir respuesta..."
          class="flex-1 border px-3 py-2 rounded"
          value={mensaje()}
          onInput={(e) => setMensaje(e.currentTarget.value)}
          onKeyPress={(e) => e.key === "Enter" && enviar()}
        />
        <button
          onClick={enviar}
          disabled={enviando()}
          class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
