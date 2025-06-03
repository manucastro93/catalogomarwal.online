import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Package, ChevronDown } from '@/icons';
import { esOperario } from './utils';
import theme from '@/styles/sidebarTheme';

export default function Ventas(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(
    location.pathname.startsWith('/Pedidos') ||
    location.pathname.startsWith('/Facturas') ||
    location.pathname.startsWith('/ServicioComercial') || // si lo renombras así
    location.pathname.startsWith('/Stock')
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
          <ConPermiso modulo="Ventas_Pedidos" accion="ver">
            <SidebarLink href="/Pedidos" texto="Pedidos" activo={esActivo('/Pedidos')} />
          </ConPermiso>
          <ConPermiso modulo="Ventas_Facturas" accion="ver">
            <SidebarLink href="/Facturas" texto="Facturas" activo={esActivo('/Facturas')} />
          </ConPermiso>
          <ConPermiso modulo="Ventas_Eficiencia" accion="ver">
            <SidebarLink href="/ServicioComercial" texto="Servicio comercial" activo={esActivo('/ServicioComercial')} />
          </ConPermiso>
          <ConPermiso modulo="Ventas_Stock" accion="ver">
            <SidebarLink href="/Stock" texto="Stock" activo={esActivo('/Stock')} />
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
