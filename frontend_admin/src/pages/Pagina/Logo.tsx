import { createResource, createSignal, Show } from "solid-js";
import { obtenerPagina, subirLogo } from "@/services/pagina.service";
import ModalMensaje from "@/components/Layout/ModalMensaje";

export default function Logo() {
  const [pagina, { refetch }] = createResource(obtenerPagina);
  const [logo, setLogo] = createSignal<File | null>(null);
  const [mensaje, setMensaje] = createSignal("");

  const handleLogoUpload = async () => {
    if (!logo()) return;
    try {
      await subirLogo(logo()!);
      setMensaje("Logo actualizado correctamente");
      refetch();
    } catch (error) {
      console.error(error);
      setMensaje("Error al actualizar el logo");
    }
  };

  return (
    <div class="p-6 space-y-6">
      <h1 class="text-2xl font-bold">Logo</h1>

      <Show when={pagina()?.logo}>
        <div class="bg-gray-100 border border-gray-300 rounded p-2 inline-block">
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`}
            alt="Logo actual"
            class="h-24 object-contain"
          />
        </div>
      </Show>

      <div class="flex flex-col gap-2">
        <label class="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-fit">
          Cargar nuevo logo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogo(e.currentTarget.files?.[0] ?? null)}
            class="hidden"
          />
        </label>
        <Show when={logo()}>
          <p class="text-sm text-gray-700">{(logo() as File).name}</p>
        </Show>
        <button
          onClick={handleLogoUpload}
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-fit"
        >
          Subir logo
        </button>
      </div>

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
    </div>
  );
}
