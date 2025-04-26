
import { A, useLocation } from '@solidjs/router';
import { Show, createSignal, createResource } from 'solid-js';
import { useAuth } from '../../store/auth';
import { obtenerPagina } from '../../services/pagina.service';
import { ROLES_USUARIOS } from '../../constants/rolesUsuarios';
import {
  ChevronDown, ChevronUp, Home, Package, Users,
  ChartLine, Layers, Settings
} from 'lucide-solid';
import ConPermiso from './ConPermiso';

export default function Sidebar() {
  const location = useLocation();
  const { usuario, permisos } = useAuth();
  const [pagina] = createResource(obtenerPagina);

  const esActivo = (path: string) => location.pathname === path;
  const empiezaCon = (prefix: string) => location.pathname.startsWith(prefix);

  const [ventasOpen, setVentasOpen] = createSignal(false);
  const [produccionOpen, setProduccionOpen] = createSignal(false);
  const [metalmecOpen, setMetalmecOpen] = createSignal(false);
  const [paginaOpen, setPaginaOpen] = createSignal(empiezaCon('/pagina'));
  const [graficosOpen, setGraficosOpen] = createSignal(empiezaCon('/Graficos'));
  const [abierto, setAbierto] = createSignal(false);

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
        ${abierto() ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed lg:z-50 lg:min-h-screen`}>
        <Show when={abierto()}>
          <button class="absolute top-4 right-4 text-white lg:hidden" onClick={() => setAbierto(false)}>✕</button>
        </Show>

        <img src={`${import.meta.env.VITE_BACKEND_URL}${pagina()?.logo}`} alt="Logo actual" class="h-24 mb-6 mx-auto" />

        <nav class="flex flex-col gap-2 text-lg">
          <ConPermiso modulo="Inicio" accion="ver">
            <A href="/Inicio" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition"
              classList={{ 'bg-gray-700 font-bold': esActivo('/Inicio') }}>
              <Home size={16} /> Inicio
            </A>
          </ConPermiso>

          <div>
            <button onClick={() => setVentasOpen(!ventasOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
              <span class="flex items-center gap-2"><Package size={16} /> Ventas</span>
              {ventasOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <Show when={ventasOpen()}>
              <div class="ml-5 flex flex-col gap-1 mt-1">
                <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.OPERARIO}>
                  <ConPermiso modulo="Pedidos" accion="ver">
                    <A href="/Pedidos" classList={{ 'text-blue-400': esActivo('/Pedidos') }}>Pedidos</A>
                  </ConPermiso>
                </Show>
                <ConPermiso modulo="Productos" accion="ver">
                  <A href="/Productos" classList={{ 'text-blue-400': esActivo('/Productos') }}>Productos</A>
                </ConPermiso>
                <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.OPERARIO}>
                  <ConPermiso modulo="Categorias" accion="ver">
                    <A href="/Categorias" classList={{ 'text-blue-400': esActivo('/Categorias') }}>Categorías</A>
                  </ConPermiso>
                  <ConPermiso modulo="Clientes" accion="ver">
                    <A href="/Clientes" classList={{ 'text-blue-400': esActivo('/Clientes') }}>Clientes</A>
                  </ConPermiso>
                </Show>
                <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO || usuario()?.rolUsuarioId === ROLES_USUARIOS.ADMINISTRADOR}>
                  <ConPermiso modulo="Vendedores" accion="ver">
                    <A href="/Vendedores" classList={{ 'text-blue-400': esActivo('/Vendedores') }}>Vendedores</A>
                  </ConPermiso>
                </Show>
                <ConPermiso modulo="Estadisticas" accion="ver">
                  <A href="/Estadisticas" classList={{ 'text-blue-400': esActivo('/Estadisticas') }}>Estadísticas</A>
                </ConPermiso>
                <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO || usuario()?.rolUsuarioId === ROLES_USUARIOS.ADMINISTRADOR}>
                  <ConPermiso modulo="LogsCliente" accion="ver">
                    <A href="/LogsCliente" classList={{ 'text-blue-400': esActivo('/LogsCliente') }}>Actividad Clientes</A>
                  </ConPermiso>
                </Show>
              </div>
            </Show>
          </div>

          <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR}>
            <div>
              <button onClick={() => setProduccionOpen(!produccionOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
                <span class="flex items-center gap-2"><Layers size={16} /> Producción</span>
                {produccionOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <Show when={produccionOpen()}>               
                <div class="ml-5 flex flex-col gap-1 mt-1">
                <ConPermiso modulo="Operarios" accion="ver">
                    <A href="/Produccion/Operarios" classList={{ 'text-blue-400': esActivo('/Produccion/Operarios') }}>Operarios</A>
                  </ConPermiso>
                  <button onClick={() => setMetalmecOpen(!metalmecOpen())} class="flex justify-between items-center">
                    <span>Metalúrgica</span>
                    {metalmecOpen() ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <Show when={metalmecOpen()}>
                    <div class="ml-4 flex flex-col gap-1">
                      <ConPermiso modulo="MetalurgicaProductos" accion="ver">
                        <A href="/Metalurgica/Productos" classList={{ 'text-blue-400': esActivo('/Metalurgica/Productos') }}>Productos</A>
                      </ConPermiso>
                      <ConPermiso modulo="MetalurgicaConfiguracion" accion="ver">
                        <A href="/Metalurgica/Configuracion" classList={{ 'text-blue-400': esActivo('/Metalurgica/Configuracion') }}>Configuración</A>
                      </ConPermiso>
                      <ConPermiso modulo="MetalurgicaRegistro" accion="ver">
                        <A href="/Metalurgica/Registro" classList={{ 'text-blue-400': esActivo('/Metalurgica/Registro') }}>Registro de Producción Diaria</A>
                      </ConPermiso>
                    </div>
                  </Show>
                  <ConPermiso modulo="Inyeccion" accion="ver">
                    <A href="/Produccion/Inyeccion" classList={{ 'text-blue-400': esActivo('/Produccion/Inyeccion') }}>Inyección</A>
                  </ConPermiso>
                  <ConPermiso modulo="Hojalateria" accion="ver">
                    <A href="/Produccion/Hojalateria" classList={{ 'text-blue-400': esActivo('/Produccion/Hojalateria') }}>Hojalatería</A>
                  </ConPermiso>
                  <ConPermiso modulo="ProduccionDiaria" accion="ver">
                    <A href="/Produccion/ProduccionDiaria" classList={{ 'text-blue-400': esActivo('/Produccion/ProduccionDiaria') }}>Producción Diaria</A>
                  </ConPermiso>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO}>
            <ConPermiso modulo="Administradores" accion="ver">
              <A href="/Administradores" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition"
                classList={{ 'bg-gray-700 font-bold': esActivo('/Administradores') }}>
                <Users size={16} /> Usuarios
              </A>
            </ConPermiso>
          </Show>

          <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO || usuario()?.rolUsuarioId === ROLES_USUARIOS.ADMINISTRADOR}>
            <div>
              <button onClick={() => setPaginaOpen(!paginaOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
                <span class="flex items-center gap-2"><Settings size={16} /> Página</span>
                {paginaOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <Show when={paginaOpen()}>
                <div class="ml-5 flex flex-col gap-1 mt-1">
                  <ConPermiso modulo="PaginaLogo" accion="ver">
                    <A href="/pagina/logo" classList={{ 'text-blue-400 font-semibold': esActivo('/pagina/logo') }}>Logo</A>
                  </ConPermiso>
                  <ConPermiso modulo="PaginaBanners" accion="ver">
                    <A href="/pagina/banners" classList={{ 'text-blue-400 font-semibold': esActivo('/pagina/banners') }}>Banners</A>
                  </ConPermiso>
                  <ConPermiso modulo="RolesUsuarios" accion="ver">
                    <A href="/pagina/roles-usuarios" classList={{ 'text-blue-400 font-semibold': esActivo('/pagina/roles-usuarios') }}>Roles Usuarios</A>
                  </ConPermiso>
                  <ConPermiso modulo="EstadosPedidos" accion="ver">
                    <A href="/pagina/estados-pedidos" classList={{ 'text-blue-400 font-semibold': esActivo('/pagina/estados-pedidos') }}>Estados Pedidos</A>
                  </ConPermiso>
                </div>
              </Show>
            </div>
          </Show>

          <ConPermiso modulo="Graficos" accion="ver">
            <div>
              <button onClick={() => setGraficosOpen(!graficosOpen())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
                <span class="flex items-center gap-2"><ChartLine size={16} /> Gráficos</span>
                {graficosOpen() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <Show when={graficosOpen()}>
                <div class="ml-5 flex flex-col gap-1 mt-1">
                  {/*<A href="/Graficos" classList={{ 'text-blue-400 font-semibold': esActivo('/Graficos') }}>General</A>*/}
                  <A href="/Graficos/ResumenProduccion" classList={{ 'text-blue-400 font-semibold': esActivo('/Graficos/Produccion') }}>Producción</A>
                </div>
              </Show>
            </div>
          </ConPermiso>

        </nav>
      </aside>
    </>
  );
}
