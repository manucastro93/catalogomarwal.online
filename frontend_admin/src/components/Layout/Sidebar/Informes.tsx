import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { BarChart3, ChevronDown, ChevronUp } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Informes(props: { expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/Informes'));
  const [prodOpen, setProdOpen] = createSignal(false);
  const [ventasOpen, setVentasOpen] = createSignal(false);
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
          <BarChart3 size={18} />
        </div>
        <Show when={props.expandido}>
          <span class={theme.itemTexto}>Informes</span>
          <ChevronDown
            size={18}
            class={`ml-auto transition-transform duration-200 ${open() ? 'rotate-180' : ''}`}
          />
        </Show>
      </button>

      <Show when={open() && props.expandido}>
        <div class="flex flex-col mt-1">

          {/* Submenú Producción */}
          <button
            onClick={() => setProdOpen(!prodOpen())}
            class={`${theme.paddingSubitem} text-left ${theme.textoSubitem}`}
          >
            Producción
            <Show when={prodOpen()}>
              <ChevronUp class="inline ml-2" size={14} />
            </Show>
            <Show when={!prodOpen()}>
              <ChevronDown class="inline ml-2" size={14} />
            </Show>
          </button>

          <Show when={prodOpen()}>
            <div class="flex flex-col">
              <ConPermiso modulo="Informes_Produccion_Diaria" accion="ver">
                <SidebarSubLink href="/Informes/ProduccionDiaria" texto="Producción diaria" activo={esActivo('/Informes/ProduccionDiaria')} />
              </ConPermiso>
              <ConPermiso modulo="Informes_Produccion_Metalurgica" accion="ver">
                <SidebarSubLink href="/Informes/Metalurgica" texto="Metalúrgica" activo={esActivo('/Informes/Metalurgica')} />
              </ConPermiso>
              <ConPermiso modulo="Informes_Produccion_Inyeccion" accion="ver">
                <SidebarSubLink href="/Informes/Inyeccion" texto="Inyección" activo={esActivo('/Informes/Inyeccion')} />
              </ConPermiso>
              <ConPermiso modulo="Informes_Produccion_Hojalateria" accion="ver">
                <SidebarSubLink href="/Informes/Hojalateria" texto="Hojalatería" activo={esActivo('/Informes/Hojalateria')} />
              </ConPermiso>
            </div>
          </Show>

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
              <ConPermiso modulo="Informes_Ventas_UltimaCompra" accion="ver">
                <SidebarSubLink href="/Informes/Ventas/InformeClientesUltimaCompra" texto="Última Compra" activo={esActivo('/Informes/Ventas/InformeClientesUltimaCompra')} />
              </ConPermiso>
              <ConPermiso modulo="Informes_ClientesNuevos" accion="ver">
                <SidebarSubLink href="/Informes/InformeClientesDux" texto="Clientes Nuevos" activo={esActivo('/Informes/ClientesNuevos')} />
              </ConPermiso>
            </div>
          </Show>

          <ConPermiso modulo="Informes_ProductosPedidosPendientes" accion="ver">
            <SidebarLink href="/Informes/ProductosPedidosPendientes" texto="Productos Pedidos pendientes" activo={esActivo('/Informes/ProductosPedidosPendientes')} />
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
