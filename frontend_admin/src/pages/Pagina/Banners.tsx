import { createResource, createSignal, For, Show } from 'solid-js';
import { obtenerPagina, crearBanner, eliminarBanner } from '@/services/pagina.service';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import dayjs from 'dayjs';
import type { Banner } from '@/types/banner';

export default function Banners() {
  const [pagina, { refetch }] = createResource(obtenerPagina);
  const [mensaje, setMensaje] = createSignal("");
  const [bannerAEliminar, setBannerAEliminar] = createSignal<Banner | null>(null);

  const [nuevoBanner, setNuevoBanner] = createSignal<{
    imagen: File | null;
    orden: number;
    fechaInicio: string;
    fechaFin: string;
  }>({
    imagen: null,
    orden: 1,
    fechaInicio: "",
    fechaFin: "",
  });

  const handleCrearBanner = async () => {
    const { imagen, orden, fechaInicio, fechaFin } = nuevoBanner();

    if (!imagen) {
      setMensaje("Seleccioná una imagen válida");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", imagen);
    formData.append("orden", String(orden || 1));
    formData.append("fechaInicio", fechaInicio || "");
    formData.append("fechaFin", fechaFin || "");

    try {
      await crearBanner(formData);
      setMensaje("Banner creado correctamente");
      setNuevoBanner({ imagen: null, orden: 1, fechaInicio: "", fechaFin: "" });
      refetch();
    } catch (err: any) {
      console.error("❌ Error al crear el banner:", err);
      const mensaje =
        err?.response?.data?.message || err?.message || "Error desconocido al crear el banner";
      setMensaje(mensaje);
    }
  };

  const eliminar = async () => {
    if (bannerAEliminar()) {
      try {
        await eliminarBanner(bannerAEliminar()!.id);
        setMensaje("Banner eliminado correctamente");
        refetch();
      } catch (err) {
        console.error(err);
        setMensaje("Error al eliminar el banner");
      } finally {
        setBannerAEliminar(null);
      }
    }
  };

  return (
    <div class="p-6 space-y-6">
      <h1 class="text-2xl font-bold">Banners</h1>

      {/* Crear nuevo banner */}
      <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
        <h2 class="text-lg font-semibold">Nuevo banner</h2>

        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <label class="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-fit">
              Seleccionar imagen
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNuevoBanner({ ...nuevoBanner(), imagen: e.currentTarget.files?.[0] ?? null })
                }
                class="hidden"
              />
            </label>
            <Show when={nuevoBanner().imagen}>
              <p class="text-sm mt-2 text-gray-700">{nuevoBanner().imagen?.name}</p>
            </Show>
          </div>

          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input
              type="number"
              value={nuevoBanner().orden}
              onInput={(e) =>
                setNuevoBanner({ ...nuevoBanner(), orden: Number(e.currentTarget.value) })
              }
              class="w-full border rounded px-3 py-2"
              placeholder="Ej: 1"
              min={1}
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={nuevoBanner().fechaInicio}
              onInput={(e) =>
                setNuevoBanner({ ...nuevoBanner(), fechaInicio: e.currentTarget.value })
              }
              class="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
            <input
              type="date"
              value={nuevoBanner().fechaFin}
              onInput={(e) =>
                setNuevoBanner({ ...nuevoBanner(), fechaFin: e.currentTarget.value })
              }
              class="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <button
          onClick={handleCrearBanner}
          class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mt-2"
        >
          Crear banner
        </button>
      </div>

      {/* Banners existentes */}
      <Show when={pagina()?.Banners?.length}>
        <div>
          <h2 class="text-lg font-semibold mb-4">Banners cargados</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={pagina()?.Banners}>
              {(b) => (
                <div class="bg-white rounded-lg shadow-md overflow-hidden border relative group">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${b.imagen}`}
                    alt="Banner"
                    class="h-32 w-full object-cover"
                  />
                  <div class="p-4">
                    <p class="text-sm text-gray-600">Orden: {b.orden}</p>
                    <p class="text-xs text-gray-500">
                      {b.fechaInicio
                        ? `${dayjs(b.fechaInicio).format("DD/MM/YYYY")} - ${dayjs(b.fechaFin).format("DD/MM/YYYY")}`
                        : "Sin límite de fechas"}
                    </p>
                  </div>
                  <button
                    onClick={() => setBannerAEliminar(b)}
                    class="absolute top-2 right-2 text-red-600 bg-white/80 rounded-full p-1 hover:text-red-800 transition"
                  >
                    🗑
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <ModalConfirmacion
        abierto={!!bannerAEliminar()}
        mensaje="¿Eliminar banner?"
        onConfirmar={eliminar}
        onCancelar={() => setBannerAEliminar(null)}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
    </div>
  );
}
