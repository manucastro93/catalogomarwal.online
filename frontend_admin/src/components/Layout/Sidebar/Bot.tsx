import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { MessageCircle, ChevronDown } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Bot(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/Bot/ConversacionesBot'));
  const esActivo = (path: string) => location.pathname === path;

  return (
    <ConPermiso modulo="Bot_Conversaciones" accion="ver">
      <div class="text-sm font-medium tracking-wide">
        <button
          onClick={() => setOpen(!open())}
          class={`${theme.itemBase} ${theme.paddingY} ${theme.redondeado} ${
            open() ? theme.itemActivo : theme.itemHover
          }`}
          style={{ color: theme.texto }}
        >
          <div class={theme.itemIconoWrapper}>
            <MessageCircle size={18} />
          </div>
          <Show when={props.expandido}>
            <span class={theme.itemTexto}>Bot</span>
            <ChevronDown
              size={18}
              class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
            />
          </Show>
        </button>

        <Show when={open() && props.expandido}>
          <div class="mt-1 flex flex-col">
            <SidebarLink
              href="/Bot/ConversacionesBot"
              texto="Conversaciones"
              activo={esActivo('/ConversacionesBot')}
            />
          </div>
        </Show>
      </div>
    </ConPermiso>
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
