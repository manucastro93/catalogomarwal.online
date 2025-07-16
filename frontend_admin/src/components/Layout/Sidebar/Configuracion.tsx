import { A, useLocation } from "@solidjs/router";
import { Settings } from "@/icons";

export default function Configuracion(props: { expandido: boolean }) {
  const location = useLocation();

  return (
    <A
      href="/Pagina/configuracion-general"
      class={`group flex items-center transition-all duration-200 px-4 py-2 rounded-md ${
        location.pathname === "/Pagina/configuracion-general"
          ? "bg-zinc-800"
          : "hover:bg-zinc-700"
      }`}
    >
      <div class="w-16 flex justify-center items-center">
        <Settings class="w-5 h-5 text-white" />
      </div>
      {props.expandido && <span class="text-sm text-white">CONFIGURACIÓN</span>}
    </A>
  );
}
