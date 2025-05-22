import { useAuth, logout as cerrarSesion } from "@/store/auth";
import NotificacionesDropdown from "./NotificacionesDropdown";
import { ROLES_USUARIOS } from "@/constants/rolesUsuarios";
import { useNavigate } from "@solidjs/router";

export default function Header(props: { expandido: boolean }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const rolId = usuario()?.rolUsuarioId;

  const titulo =
    rolId === ROLES_USUARIOS.VENDEDOR
      ? "Panel de vendedor del catálogo Marwal"
      : rolId === ROLES_USUARIOS.OPERARIO
      ? "Panel de producción Marwal"
      : "Panel de administración del catálogo";

  const handleLogout = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <header
      class={`ml-5 fixed top-0 left-0 right-0 z-40 h-16 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm pr-6 transition-all duration-300 ${
        props.expandido ? 'pl-64' : 'pl-16'
      }`}
    >
      <h1 class="text-gray-800 text-sm sm:text-lg font-semibold tracking-wide truncate">
        {titulo}
      </h1>

      <div class="flex items-center gap-4">
        <NotificacionesDropdown />
        <span
          class="text-gray-700 font-medium truncate max-w-[140px] sm:max-w-[200px]"
          title={usuario()?.nombre}
        >
          {usuario()?.nombre}
        </span>
        <button
          onClick={handleLogout}
          class="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded-md transition"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}