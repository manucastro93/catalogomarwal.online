import { useAuth } from '../store/auth';

export default function Header() {
  const { usuario, logout } = useAuth();

  return (
    <header class="flex justify-between items-center p-4 bg-white shadow-md">
      <div>
        <h1 class="text-xl font-semibold">Panel de administración del catálogo</h1>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-700">Usuario logueado: {usuario()?.nombre}</span>
        <button onClick={logout} class="text-sm bg-red-500 text-white px-3 py-1 rounded">Cerrar sesión</button>
      </div>
    </header>
  );
}
