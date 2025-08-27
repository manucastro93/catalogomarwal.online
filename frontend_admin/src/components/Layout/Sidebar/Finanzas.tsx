import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Receipt, ChevronDown } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Finanzas(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(
    location.pathname.startsWith('/Finanzas')
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
          <Receipt size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Finanzas</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="mt-1 flex flex-col">
          <ConPermiso modulo="Finanzas" accion="ver">
            <SidebarLink href="/Finanzas/ResumenAnual" texto="Resumen Anual" activo={esActivo('/Finanzas/1')} />
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
