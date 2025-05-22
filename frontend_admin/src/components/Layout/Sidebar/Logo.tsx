import { obtenerPagina } from '@/services/pagina.service';
import { createResource, Show } from 'solid-js';

export default function Logo(props: { expandido: boolean }) {
  const [pagina] = createResource(obtenerPagina);

  return (
    <div class="flex justify-center items-center h-20 my-4">
      <Show when={props.expandido}>
  <img
    src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo || '/logo-default.png'}`}
    alt="Logo"
    class="h-16 max-w-[80%] object-contain"
  />
</Show>
<Show when={!props.expandido}>
  <img
    src={`${import.meta.env.VITE_BACKEND_URL}/uploads/logo/logo-blanco-redondo.png`}
    alt="Logo Redondo"
    class="h-50 object-contain"
  />
</Show>

    </div>
  );
}
