import { A, useLocation } from '@solidjs/router';
import { Show, createSignal, createResource } from 'solid-js';
import { useAuth } from '../store/auth';
import { obtenerPagina } from '../services/pagina.service';
import { ChevronDown, ChevronUp, Home, Package, Users, BarChart, Layers, Settings, LineChart } from 'lucide-solid';

export default function Sidebar() {
  const location = useLocation();
  const { usuario } = useAuth();
  const [pagina] = createResource(obtenerPagina);

  const esActivo = (path: string) => location.pathname === path;

  const [ventasOpen, setVentasOpen] = createSignal(true);
  const [produccionOpen, setProduccionOpen] = createSignal(false);
  const [metalmecOpen, setMetalmecOpen] = createSignal(false);

  return (
    <aside class="w-64 bg-gray-900 text-white min-h-screen p-4">
      <img src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`} alt="Logo actual" class="h-24 mb-6" />
      <nav class="flex flex-col gap-2 text-sm">
        <A href="/Inicio" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Inicio') }}>
          <Home size={16} /> Inicio
        </A>

        <div>
          <button onClick={() => setVentasOpen(!ventasOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
            <span class="flex items-center gap-2"><Package size={16} /> Ventas</span>
            {ventasOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <Show when={ventasOpen()}>
            <div class="ml-5 flex flex-col gap-1 mt-1">
              <A href="/Productos" classList={{ 'text-blue-400': esActivo('/Productos') }}>Productos</A>
              <A href="/Clientes" classList={{ 'text-blue-400': esActivo('/Clientes') }}>Clientes</A>
              <A href="/Vendedores" classList={{ 'text-blue-400': esActivo('/Vendedores') }}><Show when={usuario()?.rol !== 'vendedor'}>Vendedores</Show></A>
              <A href="/Categorias" classList={{ 'text-blue-400': esActivo('/Categorias') }}>Categorías</A>
              <A href="/Pedidos" classList={{ 'text-blue-400': esActivo('/Pedidos') }}>Pedidos</A>
              <A href="/Estadisticas" classList={{ 'text-blue-400': esActivo('/Estadisticas') }}>Estadísticas</A>
            </div>
          </Show>
        </div>

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


        <Show when={usuario()?.rol === 'supremo'}>
          <A href="/Administradores" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Administradores') }}>
            <Users size={16} /> Usuarios
          </A>
        </Show>

        <A href="/Pagina" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Pagina') }}>
          <Settings size={16} /> Página
        </A>
        <A href="/Pagina" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition" classList={{ 'bg-gray-700 font-bold': esActivo('/Pagina') }}>
          <LineChart size={16} /> Gráficos
        </A>
      </nav>
    </aside>
  );
}
