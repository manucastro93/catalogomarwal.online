import { useAuth } from "../../store/auth";
import NotificacionesDropdown from "./NotificacionesDropdown";
import { ROLES_USUARIOS } from "../../constants/rolesUsuarios";

export default function Header() {
  const { usuario, logout } = useAuth();
  const rolId = usuario()?.rolUsuarioId;

  const titulo =
    rolId === ROLES_USUARIOS.VENDEDOR
      ? "Panel de vendedor del catálogo Marwal"
      : rolId === ROLES_USUARIOS.OPERARIO
      ? "Panel de producción Marwal"
      : "Panel de administración del catálogo";

  return (
    <header class="fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 lg:pl-72">
      <h1 class="text-sm sm:text-base font-semibold">{titulo}</h1>

      <div class="flex items-center gap-3 text-sm sm:text-base">
        <NotificacionesDropdown />
        <span
          class="text-gray-600 truncate max-w-[120px] sm:max-w-[180px]"
          title={usuario()?.nombre}
        >
          {usuario()?.nombre}
        </span>
        <button
          onClick={logout}
          class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition text-xs sm:text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
