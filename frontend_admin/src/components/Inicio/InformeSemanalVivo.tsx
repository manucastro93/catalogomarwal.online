import { createResource, Show } from "solid-js";
import { obtenerInformeSemanalEnVivo } from "@/services/informeSemanal.service";

export default function InformeSemanalVivo() {
  const [informe] = createResource(obtenerInformeSemanalEnVivo);

  return (
    <div class="animate-fade-in bg-white border border-gray-200 shadow-md rounded-xl px-6 py-5 mb-6 space-y-5">
      
      {/* Encabezado */}
      <div class="flex items-center justify-between">
        <h2 class="text-xl md:text-2xl font-semibold text-indigo-700 tracking-tight">
          📊 Informe Semanal de Producción
        </h2>

        <Show when={!informe.loading}>
          <div class="flex items-center gap-2 bg-green-100 text-green-700 text-xs md:text-sm font-semibold px-3 py-1 rounded-full animate-pop-in">
            ✅ Actualizado
          </div>
        </Show>
      </div>

      {/* Contenido */}
      <Show when={!informe.loading} fallback={
        <p class="text-center text-gray-400">Cargando informe...</p>
      }>
        <div class="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {informe()?.resumen}
        </div>
      </Show>

      {/* Indicadores visuales */}
      <Show when={!informe.loading}>
        <div class="flex flex-wrap justify-center gap-3 text-sm pt-2 border-t border-gray-100">

          <Show when={(informe()?.variacion ?? 0) > 10}>
            <span class="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 font-medium rounded-full shadow-sm border border-green-200">
              📈 Producción semanal alta
            </span>
          </Show>

          <Show when={(informe()?.variacion ?? 0) < -10}>
            <span class="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 font-medium rounded-full shadow-sm border border-red-200">
              📉 Producción semanal baja
            </span>
          </Show>

          <Show when={!!informe()?.feriados}>
            <span class="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-800 font-medium rounded-full shadow-sm border border-yellow-200">
              📅 Feriados considerados
            </span>
          </Show>

        </div>
      </Show>
    </div>
  );
}
