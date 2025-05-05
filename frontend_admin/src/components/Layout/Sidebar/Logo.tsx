import { obtenerPagina } from '@/services/pagina.service';
import { createResource } from 'solid-js';

export default function Logo() {
  const [pagina] = createResource(obtenerPagina);
  return (
    <img
      src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo || '/logo-default.png'}`}
      alt="Logo actual"
      class="h-24 mb-6 mx-auto"
    />
  );
}
