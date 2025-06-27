import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Package, ChevronDown } from '@/icons'; // Podés cambiar el ícono si querés diferenciarlo
import theme from '@/styles/sidebarTheme';

export default function Compras(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(
    location.pathname.startsWith('/Proveedores') ||
    location.pathname.startsWith('/ProductosProveedores') ||
    location.pathname.startsWith('/ProductosCostos')
  );

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
          <Package size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Compras</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="flex flex-col mt-1">
          <ConPermiso modulo="Compras_Proveedores" accion="ver">
            <SidebarLink href="/Proveedores" texto="Proveedores" activo={esActivo('/Proveedores')} />
          </ConPermiso>
          <ConPermiso modulo="Compras_ListaPrecios" accion="ver">
            <SidebarLink href="/ProductosProveedores" texto="Lista precio proveedores" activo={esActivo('/ProductosProveedores')} />
          </ConPermiso>
          <ConPermiso modulo="Compras_ProductosCostos" accion="ver">
            <SidebarLink href="/ProductosCostos" texto="Productos costos" activo={esActivo('/ProductosCostos')} />
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
