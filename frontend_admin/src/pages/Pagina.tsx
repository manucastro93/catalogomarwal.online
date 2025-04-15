import { createResource, createSignal, For, Show } from "solid-js";
import {
  obtenerPagina,
  subirLogo,
  crearBanner,
  eliminarBanner,
} from "../services/pagina.service";
import type { Pagina } from "../shared/types/pagina";
import type { Banner } from "../shared/types/banner";
import ModalMensaje from "../components/ModalMensaje";
import ModalConfirmacion from "../components/ModalConfirmacion";
import dayjs from "dayjs";

export default function Pagina() {
  const [pagina, { refetch }] = createResource(obtenerPagina);
  const [logo, setLogo] = createSignal<File | null>(null);
  const [mensaje, setMensaje] = createSignal("");
  const [bannerAEliminar, setBannerAEliminar] = createSignal<Banner | null>(null);

  const [nuevoBanner, setNuevoBanner] = createSignal<
    Partial<Banner & { imagen: File | "" }>
  >({
    imagen: "",
    orden: 1,
    fechaInicio: "",
    fechaFin: "",
  });

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

  const handleCrearBanner = async () => {
    const banner = nuevoBanner();
    if (!banner.imagen || typeof banner.imagen === "string") {
      setMensaje("Seleccioná una imagen válida");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", banner.imagen);
    formData.append("orden", String(banner.orden || 1));
    formData.append("fechaInicio", banner.fechaInicio || "");
    formData.append("fechaFin", banner.fechaFin || "");

    console.log("📤 Enviando formData con:", {
      orden: banner.orden,
      fechaInicio: banner.fechaInicio,
      fechaFin: banner.fechaFin,
      imagen: banner.imagen.name,
    });

    try {
      const response = await crearBanner(formData);
      console.log("✅ Banner creado:", response);
      setMensaje("Banner creado correctamente");
      setNuevoBanner({ imagen: "", orden: 1, fechaInicio: "", fechaFin: "" });
      refetch();
    } catch (err: any) {
      console.error("❌ Error al crear el banner:", err);
      const mensaje =
        err?.response?.data?.message ||
        err?.message ||
        "Error desconocido al crear el banner";
      setMensaje(mensaje);
    }
  };

  return (
    <div class="p-6 space-y-8">
      <h1 class="text-2xl font-bold">Configuración de la Página</h1>

      {/* Logo */}
      <div class="bg-white p-4 rounded shadow space-y-4">
        <h2 class="font-semibold text-lg">Logo</h2>
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
            Cargar desde archivo nuevo logo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.currentTarget.files?.[0] ?? null)}
              class="hidden"
            />
          </label>
          <Show when={logo()}>
            <p class="text-sm text-gray-700">{logo()?.name}</p>
          </Show>
          <button
            onClick={handleLogoUpload}
            class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-fit"
          >
            Subir el nuevo logo cargado
          </button>
        </div>
      </div>

      {/* Nuevo Banner */}
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
                  setNuevoBanner({ ...nuevoBanner(), imagen: e.currentTarget.files?.[0] })
                }
                class="hidden"
              />
            </label>
            <Show when={nuevoBanner().imagen && typeof nuevoBanner().imagen !== "string"}>
              <p class="text-sm mt-2 text-gray-700">{(nuevoBanner().imagen as File)?.name}</p>
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

      {/* Banners cargados */}
      <Show when={pagina()?.Banners?.length}>
        <div class="mt-8">
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
        titulo="¿Eliminar banner?"
        mensaje="Esta acción no se puede deshacer."
        confirmarTexto="Eliminar"
        cancelarTexto="Cancelar"
        onConfirmar={async () => {
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
        }}
        onCancelar={() => setBannerAEliminar(null)}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
    </div>
  );
}
