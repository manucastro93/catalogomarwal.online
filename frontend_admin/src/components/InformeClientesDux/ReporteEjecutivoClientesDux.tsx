import { createResource, createSignal, Show } from "solid-js";
import { obtenerReporteEjecutivoClientesDux } from "@/services/clienteDux.service";
import { Copy } from "lucide-solid";

export default function ReporteEjecutivoClientesDux() {
  const [reporte] = createResource(obtenerReporteEjecutivoClientesDux);
  const [abierto, setAbierto] = createSignal(false);
  const [copiado, setCopiado] = createSignal(false);

  const handleCopy = async () => {
    if (reporte()) {
      await navigator.clipboard.writeText(reporte()!);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    }
  };

  return (
    <div class="p-6 max-w-2xl mx-auto">
      <button
        class={`w-full flex items-center justify-between px-4 py-3 rounded-xl shadow bg-blue-50 hover:bg-blue-100 transition mb-4`}
        onClick={() => setAbierto((v) => !v)}
      >
        <span class="text-lg font-semibold text-blue-900">Reporte ejecutivo de clientes Dux</span>
        <span class={`ml-2 transition-transform ${abierto() ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      <Show when={abierto()}>
        <div class="relative bg-white border rounded-xl shadow p-5 animate-fade-in">
          <Show when={reporte()}>
            <button
              class="absolute top-3 right-3 flex items-center gap-1 text-gray-400 hover:text-blue-600 text-sm px-2 py-1 bg-gray-100 rounded"
              onClick={handleCopy}
              title="Copiar texto"
            >
              <Copy size={16} /> {copiado() ? "Copiado!" : "Copiar"}
            </button>
            <pre class="whitespace-pre-line text-gray-800 font-mono text-[15px] leading-snug">{reporte()}</pre>
          </Show>
          <Show when={reporte.loading}>
            <div class="text-gray-400 italic py-8 text-center">Cargando reporte…</div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
