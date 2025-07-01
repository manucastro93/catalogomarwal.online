import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Layers, ChevronDown } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Produccion(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(
    location.pathname.startsWith('/Produccion')
  );

  const esActivo = (path: string) => location.pathname === path;

  if (props.usuario?.rolUsuarioId === 3) return null;

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
          <Layers size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Producción</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="mt-1 flex flex-col">
          <ConPermiso modulo="Produccion_Metalurgica" accion="ver">
            <SidebarLink href="/Produccion/Metalurgica" texto="Metalúrgica" activo={esActivo('/Produccion/Metalurgica')} />
          </ConPermiso>
          <ConPermiso modulo="Produccion_Inyeccion" accion="ver">
            <SidebarLink href="/Produccion/Inyeccion" texto="Inyección" activo={esActivo('/Produccion/Inyeccion')} />
          </ConPermiso>
          <ConPermiso modulo="Produccion_Hojalateria" accion="ver">
            <SidebarLink href="/Produccion/Hojalateria" texto="Hojalatería" activo={esActivo('/Produccion/Hojalateria')} />
          </ConPermiso>
          <ConPermiso modulo="Produccion_Diaria" accion="ver">
            <SidebarLink href="/Produccion/ProduccionDiaria" texto="Producción diaria" activo={esActivo('/Produccion/ProduccionDiaria')} />
          </ConPermiso>
          <ConPermiso modulo="Produccion_OT" accion="ver">
            <SidebarLink href="/Produccion/OrdenesDeTrabajo" texto="Órdenes de trabajo" activo={esActivo('/Produccion/OrdenesDeTrabajo')} />
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
