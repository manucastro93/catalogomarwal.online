import { createResource, Show } from "solid-js";
import { obtenerPagina } from "../services/pagina.service";

export default function SinAcceso() {
  const [pagina] = createResource(obtenerPagina);
  return (
    <div class="min-h-screen flex flex-col justify-center items-center text-center bg-gradient-to-b from-blue-400 to-blue-600 p-6">
      <h1 class="text-3xl font-bold text-white mb-4">
        Pedile el link a tu vendedor
      </h1>
      <p class="text-lg text-white mb-8">
        Para ver el catálogo, solicitá el link a tu vendedor.
      </p>
      <Show when={pagina()}>
        <img
          src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`}
          alt="Logo Marwal"
          class="w-32"
        />
      </Show>
    </div>
  );
}
