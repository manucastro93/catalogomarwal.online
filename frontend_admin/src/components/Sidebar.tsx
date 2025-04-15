import { A, useLocation } from '@solidjs/router';
import { Show, createResource } from 'solid-js';
import { useAuth } from '../store/auth';
import { obtenerPagina } from '../services/pagina.service';


export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [pagina, { refetch }] = createResource(obtenerPagina);
  const esActivo = (path: string) => location.pathname === path;

  return (
    <aside class="w-64 bg-gray-900 text-white min-h-screen p-4">
      <img src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`}  alt="Logo actual" class="h-24" />
      <nav class="flex flex-col gap-2">
        <A href="/Inicio" class={esActivo('/Inicio') ? 'font-bold underline' : ''}>Inicio</A>
        <A href="/Productos" class={esActivo('/Productos') ? 'font-bold underline' : ''}>Productos</A>
        <A href="/Clientes" class={esActivo('/Clientes') ? 'font-bold underline' : ''}>Clientes</A>
        <A href="/Pedidos" class={esActivo('/Pedidos') ? 'font-bold underline' : ''}>Pedidos</A> 
        <Show when={usuario()?.rol !== 'vendedor'}>
          <A href="/Vendedores" class={esActivo('/Vendedores') ? 'font-bold underline' : ''}>Vendedores</A>
        </Show>
        <A href="/Estadisticas" class={esActivo('/Estadisticas') ? 'font-bold underline' : ''}>Estadísticas</A>
        <A href="/Categorias" class={esActivo('/Categorias') ? 'font-bold underline' : ''}>Categorías</A>
        <Show when={usuario()?.rol === 'supremo'}>
          <A href="/Administradores" class={esActivo('/Administradores') ? 'font-bold underline' : ''}>Administradores</A>
        </Show>
        <A href="/Pagina" class={esActivo('/Pagina') ? 'font-bold underline' : ''}>Página</A>
      </nav>
    </aside>
  );
}
