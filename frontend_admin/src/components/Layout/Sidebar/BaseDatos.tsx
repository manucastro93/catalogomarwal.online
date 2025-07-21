import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Database, ChevronDown, ChevronUp } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function BaseDatos(props: { expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/BaseDatos'));
  const [ventasOpen, setVentasOpen] = createSignal(false);
  const [produccionOpen, setProduccionOpen] = createSignal(false);

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
          <Database size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Base de datos</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="flex flex-col mt-1">

          {/* Submenú Ventas */}
          <button
            onClick={() => setVentasOpen(!ventasOpen())}
            class={`${theme.paddingSubitem} text-left ${theme.textoSubitem}`}
          >
            Ventas
            <Show when={ventasOpen()}>
              <ChevronUp class="inline ml-2" size={14} />
            </Show>
            <Show when={!ventasOpen()}>
              <ChevronDown class="inline ml-2" size={14} />
            </Show>
          </button>

          <Show when={ventasOpen()}>
            <div class="flex flex-col">
              <ConPermiso modulo="BaseDatos_Ventas_Clientes" accion="ver">
                <SidebarSubLink href="/BaseDatos/Clientes" texto="Clientes" activo={esActivo('/BaseDatos/Clientes')} />
              </ConPermiso>
              <ConPermiso modulo="BaseDatos_Ventas_Productos" accion="ver">
                <SidebarSubLink href="/BaseDatos/Productos" texto="Productos" activo={esActivo('/BaseDatos/Productos')} />
              </ConPermiso>
              <ConPermiso modulo="BaseDatos_Ventas_Categorias" accion="ver">
                <SidebarSubLink href="/BaseDatos/Categorias" texto="Categorías" activo={esActivo('/BaseDatos/Categorias')} />
              </ConPermiso>
              <ConPermiso modulo="BaseDatos_Ventas_Vendedores" accion="ver">
                <SidebarSubLink href="/BaseDatos/Vendedores" texto="Vendedores" activo={esActivo('/BaseDatos/Vendedores')} />
              </ConPermiso>
            </div>
          </Show>

          {/* Submenú Producción */}
          <button
            onClick={() => setProduccionOpen(!produccionOpen())}
            class={`${theme.paddingSubitem} text-left ${theme.textoSubitem}`}
          >
            Producción
            <Show when={produccionOpen()}>
              <ChevronUp class="inline ml-2" size={14} />
            </Show>
            <Show when={!produccionOpen()}>
              <ChevronDown class="inline ml-2" size={14} />
            </Show>
          </button>

          <Show when={produccionOpen()}>
            <div class="flex flex-col">
              <ConPermiso modulo="BaseDatos_Produccion_Operarios" accion="ver">
                <SidebarSubLink href="/BaseDatos/Operarios" texto="Operarios" activo={esActivo('/BaseDatos/Operarios')} />
              </ConPermiso>
            </div>
          </Show>

        </div>
      </Show>
    </div>
  );
}

function SidebarSubLink(props: { href: string; texto: string; activo: boolean }) {
  return (
    <A
      href={props.href}
      class={`block ${theme.paddingSubSubitem} text-sm transition-colors ${
        props.activo ? theme.subsubitemActivo : theme.textoSubSubitem
      }`}
    >
      {props.texto}
    </A>
  );
}
