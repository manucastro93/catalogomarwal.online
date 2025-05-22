import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Package, ChevronDown } from '@/icons';
import { esOperario } from './utils';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import theme from '@/styles/sidebarTheme';

export default function Ventas(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(
    location.pathname.startsWith('/Pedidos') ||
    location.pathname.startsWith('/Productos') ||
    location.pathname.startsWith('/Categorias') ||
    location.pathname.startsWith('/Clientes') ||
    location.pathname.startsWith('/Vendedores') ||
    location.pathname.startsWith('/LogsCliente') ||
    location.pathname.startsWith('/Estadisticas')
  );

  const esActivo = (path: string) => location.pathname === path;

  if (esOperario(props.usuario?.rolUsuarioId)) return null;

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
          <Package size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Ventas</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="flex flex-col mt-1">
          <ConPermiso modulo="Pedidos" accion="ver">
            <SidebarLink href="/Pedidos" texto="Pedidos" activo={esActivo('/Pedidos')} />
          </ConPermiso>
          <ConPermiso modulo="Productos" accion="ver">
            <SidebarLink href="/Productos" texto="Productos" activo={esActivo('/Productos')} />
          </ConPermiso>
          <ConPermiso modulo="Categorias" accion="ver">
            <SidebarLink href="/Categorias" texto="Categorías" activo={esActivo('/Categorias')} />
          </ConPermiso>
          <ConPermiso modulo="Clientes" accion="ver">
            <SidebarLink href="/Clientes" texto="Clientes" activo={esActivo('/Clientes')} />
          </ConPermiso>
          <Show when={[ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(props.usuario?.rolUsuarioId)}>
            <ConPermiso modulo="Vendedores" accion="ver">
              <SidebarLink href="/Vendedores" texto="Vendedores" activo={esActivo('/Vendedores')} />
            </ConPermiso>
            <ConPermiso modulo="LogsCliente" accion="ver">
              <SidebarLink href="/LogsCliente" texto="Actividad Clientes" activo={esActivo('/LogsCliente')} />
            </ConPermiso>
          </Show>
          <ConPermiso modulo="Estadisticas" accion="ver">
            <SidebarLink href="/Estadisticas" texto="Resumen del mes" activo={esActivo('/Estadisticas')} />
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
