import { useAuth } from "../store/auth";
import NotificacionesDropdown from "../components/NotificacionesDropdown";

export default function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header class="fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm h-16 flex items-center justify-between px-4 lg:pl-72">
      <h1 class="text-sm sm:text-base md:text-lg font-semibold text-gray-700 truncate">
        Panel de administración del catálogo
      </h1>

      <div class="flex items-center gap-3 text-sm sm:text-base">
      <NotificacionesDropdown />
        <span class="text-gray-600 truncate max-w-[120px] sm:max-w-[180px]">
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
