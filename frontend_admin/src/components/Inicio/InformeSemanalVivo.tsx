import { createResource, Show } from "solid-js";
import { obtenerInformeSemanalEnVivo } from "@/services/informeSemanal.service";

export default function InformeSemanalVivo() {
  const [informe] = createResource(obtenerInformeSemanalEnVivo);

  return (
    <div class="animate-fade-in bg-gradient-to-br from-indigo-50 to-white shadow rounded-lg p-4 md:p-6 mb-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg md:text-2xl font-bold text-indigo-700">
          Informe Semanal De Producción(En Vivo)
        </h2>

        <Show when={!informe.loading}>
          <div class="flex items-center gap-2 bg-green-100 text-green-700 text-xs md:text-sm font-semibold px-3 py-1 rounded-full animate-pop-in">
            ✅ Actualizado
          </div>
        </Show>
      </div>

      <Show when={!informe.loading} fallback={<p class="text-center text-gray-400">Cargando informe...</p>}>
  <div class="bg-white border border-gray-200 rounded-md p-4 leading-relaxed text-gray-700 whitespace-pre-line text-sm md:text-base">
    <div innerHTML={informe()?.html} />
  </div>
</Show>


      <div class="flex flex-wrap gap-2 text-xs md:text-sm text-gray-500 justify-center">
        <span class="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full">
          + Producción alta
        </span>
        <span class="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full">
          - Producción baja
        </span>
        <span class="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
          Feriado considerado
        </span>
      </div>
    </div>
  );
}
