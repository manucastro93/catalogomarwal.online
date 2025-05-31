import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { ChartLine, ChevronDown, TrendingUp } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Graficos(props: { expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/Graficos/'));
  const esActivo = (path: string) => location.pathname === path;

  return (
    <ConPermiso modulo="Graficos" accion="ver">
      <div class="text-sm font-medium tracking-wide">
        <button
          onClick={() => setOpen(!open())}
          class={`${theme.itemBase} ${theme.paddingY} ${theme.redondeado} ${
            open() ? theme.itemActivo : theme.itemHover
          }`}
          style={{ color: theme.texto }}
        >
          <div class={theme.itemIconoWrapper}>
            <ChartLine size={18} />
          </div>
          <Show when={props.expandido}>
            <span class={theme.itemTexto}>Gráficos</span>
            <ChevronDown
              size={18}
              class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
            />
          </Show>
        </button>

        <Show when={open() && props.expandido}>
          <div class="mt-1 flex flex-col">
            <SidebarLink href="/Graficos/ResumenProduccion" texto="Producción" activo={esActivo('/Graficos/ResumenProduccion')} />
            <SidebarLink href="/Graficos/Eficiencia" texto="Eficiencia" activo={esActivo('/Graficos/Eficiencia')} />
            <SidebarLink href="/Graficos/ResumenVentas" texto="Ventas" activo={esActivo('/Graficos/ResumenVentas')} />
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
