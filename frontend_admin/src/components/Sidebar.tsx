import { A, useLocation } from '@solidjs/router';
import { Show, createSignal, createResource } from 'solid-js';
import { useAuth } from '../store/auth';
import { obtenerPagina } from '../services/pagina.service';
import {
  ChevronDown, ChevronUp, Home, Package, Users,
  ChartLine, Layers, Settings
} from 'lucide-solid';

export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [pagina] = createResource(obtenerPagina);

  const esActivo = (path: string) => location.pathname === path;

  const [ventasOpen, setVentasOpen] = createSignal(false);
  const [produccionOpen, setProduccionOpen] = createSignal(false);
  const [metalmecOpen, setMetalmecOpen] = createSignal(false);
  const [abierto, setAbierto] = createSignal(false); // Para mobile

  return (
    <>
      {/* Botón hamburguesa para mobile */}
      <button
        class="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
        onClick={() => setAbierto(true)}
      >
        <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Fondo oscuro al abrir menú en mobile */}
      <Show when={abierto()}>
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setAbierto(false)}
        />
      </Show>

      {/* Sidebar completo */}
      <aside
  class={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 text-white p-4 transition-transform duration-300
  ${abierto() ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:z-50 lg:min-h-screen`}
>


        {/* Botón cerrar en mobile */}
        <Show when={abierto()}>
          <button
            class="absolute top-4 right-4 text-white lg:hidden"
            onClick={() => setAbierto(false)}
          >
            ✕
          </button>
        </Show>

        {/* Logo */}
        <img
          src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`}
          alt="Logo actual"
          class="h-24 mb-6 mx-auto"
        />

        {/* Navegación */}
        <nav class="flex flex-col gap-2 text-lg">
          <A href="/Inicio" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Inicio') }}>
            <Home size={16} /> Inicio
          </A>

          {/* Ventas */}
          <div>
            <button onClick={() => setVentasOpen(!ventasOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
              <span class="flex items-center gap-2"><Package size={16} /> Ventas</span>
              {ventasOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Show when={ventasOpen()}>
              <div class="ml-5 flex flex-col gap-1 mt-1">
                <A href="/Productos" classList={{ 'text-blue-400': esActivo('/Productos') }}>Productos</A>
                <A href="/Clientes" classList={{ 'text-blue-400': esActivo('/Clientes') }}>Clientes</A>
                <Show when={usuario()?.rol !== 'vendedor'}>
                  <A href="/Vendedores" classList={{ 'text-blue-400': esActivo('/Vendedores') }}>Vendedores</A>
                </Show>
                <A href="/Categorias" classList={{ 'text-blue-400': esActivo('/Categorias') }}>Categorías</A>
                <A href="/Pedidos" classList={{ 'text-blue-400': esActivo('/Pedidos') }}>Pedidos</A>
                <A href="/Estadisticas" classList={{ 'text-blue-400': esActivo('/Estadisticas') }}>Estadísticas</A>
              </div>
            </Show>
          </div>

          {/* Producción */}
          <div>
            <button onClick={() => setProduccionOpen(!produccionOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
              <span class="flex items-center gap-2"><Layers size={16} /> Producción</span>
              {produccionOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Show when={produccionOpen()}>
              <div class="ml-5 flex flex-col gap-1 mt-1">
                <button onClick={() => setMetalmecOpen(!metalmecOpen())} class="flex justify-between items-center">
                  <span>Metalúrgica</span>
                  {metalmecOpen() ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <Show when={metalmecOpen()}>
                  <div class="ml-4 flex flex-col gap-1">
                    <A href="/Metalurgica/Productos" classList={{ 'text-blue-400': esActivo('/Metalurgica/Productos') }}>Productos</A>
                    <A href="/Metalurgica/Configuracion" classList={{ 'text-blue-400': esActivo('/Metalurgica/Configuracion') }}>Configuración</A>
                    <A href="/Metalurgica/Registro" classList={{ 'text-blue-400': esActivo('/Metalurgica/Registro') }}>Registro de Producción Diaria</A>
                  </div>
                </Show>
                <A href="/Produccion/Inyeccion" classList={{ 'text-blue-400': esActivo('/Produccion/Inyeccion') }}>Inyección</A>
                <A href="/Produccion/Hojalateria" classList={{ 'text-blue-400': esActivo('/Produccion/Hojalateria') }}>Hojalatería</A>
                <A href="/Produccion/Contabilizacion" classList={{ 'text-blue-400': esActivo('/Produccion/Contabilizacion') }}>Contabilización Producción Diaria</A>
              </div>
            </Show>
          </div>

          {/* Admin */}
          <Show when={usuario()?.rol === 'supremo'}>
            <A href="/Administradores" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Administradores') }}>
              <Users size={16} /> Usuarios
            </A>
          </Show>
          <Show when={usuario()?.rol !== 'vendedor'}>
          {/* Página y gráficos */}
            <A href="/Pagina" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Pagina') }}>
              <Settings size={16} /> Página
            </A>
          </Show>
          <A href="/Graficos" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Graficos') }}>
            <ChartLine size={16} /> Gráficos
          </A>
        </nav>
      </aside>
    </>
  );
}
