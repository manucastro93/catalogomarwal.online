import { Show } from 'solid-js';
import type { ImagenProducto } from '@/types/producto';

export default function TabImagenes(props: { imagenes: ImagenProducto[] }) {
  const link: string = import.meta.env.VITE_BACKEND_URL;

  return (
    <Show
      when={Array.isArray(props.imagenes) && props.imagenes.length > 0}
      fallback={<p class="text-sm text-gray-600">Este producto no tiene imágenes cargadas.</p>}
    >
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        {props.imagenes.map((img) => (
          <img
            src={link + img.url}
            alt="imagen"
            class="rounded w-full h-32 object-cover border"
            loading="lazy"
          />
        ))}
      </div>
    </Show>
  );
}
