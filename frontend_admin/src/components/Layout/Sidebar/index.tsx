import { A, useLocation } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
import { useAuth } from '@/store/auth';
import ConPermiso from '@/components/Layout/ConPermiso';
import Logo from './Logo';
import Ventas from './Ventas';
import Produccion from './Produccion';
import Administradores from './Administradores';
import Pagina from './Pagina';
import Graficos from './Graficos';

export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [abierto, setAbierto] = createSignal(false);

  if (!usuario()) return null;

  return (
    <>
      <button class="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow" onClick={() => setAbierto(true)}>
        <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Show when={abierto()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setAbierto(false)} />
      </Show>

      <aside class={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white p-4 transition-transform duration-300
        ${abierto() ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'} lg:fixed lg:z-50 lg:min-h-screen`}>

        <Show when={abierto()}>
          <button class="absolute top-4 right-4 text-white lg:hidden" onClick={() => setAbierto(false)}>✕</button>
        </Show>

        <Logo />

        <nav class="flex flex-col gap-2 text-lg">
            <A href="/Inicio" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition"
              classList={{ 'bg-gray-700 font-bold': location.pathname === '/Inicio' }}>
              Inicio
            </A>

          <Ventas usuario={usuario()} />

          <Produccion usuario={usuario()} />

          <Administradores usuario={usuario()} />

          <Pagina usuario={usuario()} />

          <Graficos />
        </nav>
      </aside>
    </>
  );
}