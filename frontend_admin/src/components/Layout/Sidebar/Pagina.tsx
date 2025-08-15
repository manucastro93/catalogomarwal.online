import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Settings, ChevronDown } from '@/icons';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import theme from '@/styles/sidebarTheme';

export default function Pagina(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/pagina'));
  const esActivo = (path: string) => location.pathname === path;

  return (
    <div class="text-sm font-medium tracking-wide">
      <button
        onClick={() => setOpen(!open())}
        class={`${theme.itemBase} ${theme.paddingY} ${theme.redondeado} ${
          open() ? theme.itemActivo : theme.itemHover
        }`}
        style={{ color: theme.texto }}
      >
        <div class={theme.itemIconoWrapper}>
          <Settings size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Página</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="mt-1 flex flex-col">
          <ConPermiso modulo="PaginaLogo" accion="ver">
            <SidebarLink href="/pagina/logo" texto="Logo" activo={esActivo('/pagina/logo')} />
          </ConPermiso>
          <ConPermiso modulo="PaginaBanners" accion="ver">
            <SidebarLink href="/pagina/banners" texto="Banners" activo={esActivo('/pagina/banners')} />
          </ConPermiso>
          <ConPermiso modulo="RolesUsuarios" accion="ver">
            <SidebarLink href="/pagina/roles-usuarios" texto="Roles Usuarios" activo={esActivo('/pagina/roles-usuarios')} />
          </ConPermiso>
          <ConPermiso modulo="EstadosPedidos" accion="ver">
            <SidebarLink href="/pagina/estados-pedidos" texto="Estados Pedidos" activo={esActivo('/pagina/estados-pedidos')} />
          </ConPermiso>
        </div>
      </Show>
    </div>
  );
}

function SidebarLink(props: { href: string; texto: string; activo: boolean }) {
  return (
    <A
      href={props.href}
      class={`block ${theme.paddingSubitem} text-sm transition-colors ${
        props.activo ? theme.subitemActivo : theme.textoSubitem
      }`}
    >
      {props.texto}
    </A>
  );
}
