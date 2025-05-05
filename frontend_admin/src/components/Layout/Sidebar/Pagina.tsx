import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Settings, ChevronDown, ChevronUp } from 'lucide-solid';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';

export default function Pagina(props: { usuario: any }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/pagina'));

  const esActivo = (path: string) => location.pathname === path;

  if (![ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(props.usuario?.rolUsuarioId))
    return null;

  return (
    <div>
      <button onClick={() => setOpen(!open())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
        <span class="flex items-center gap-2"><Settings size={16} /> Página</span>
        {open() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <Show when={open()}>
        <div class="ml-10 flex flex-col gap-1 mt-1">
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
  );
}
