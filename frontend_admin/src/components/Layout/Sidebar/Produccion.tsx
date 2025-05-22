import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Layers, ChevronDown, ChevronUp } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Produccion(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const esActivoSeccion =
    location.pathname.startsWith('/Produccion') || location.pathname.startsWith('/Metalurgica');
  const [open, setOpen] = createSignal(esActivoSeccion);
  const [metalmecOpen, setMetalmecOpen] = createSignal(false);
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
          <ConPermiso modulo="Operarios" accion="ver">
            <SidebarLink href="/Produccion/Operarios" texto="Operarios" activo={esActivo('/Produccion/Operarios')} />
          </ConPermiso>

          {/* Submenú Metalúrgica */}
          <button
            onClick={() => setMetalmecOpen(!metalmecOpen())}
            class={`${theme.paddingSubitem} text-left ${theme.textoSubitem}`}
          >
            Metalúrgica
            <Show when={metalmecOpen()}>
              <ChevronUp class="inline ml-2" size={14} />
            </Show>
            <Show when={!metalmecOpen()}>
              <ChevronDown class="inline ml-2" size={14} />
            </Show>
          </button>

          <Show when={metalmecOpen()}>
            <div class="flex flex-col">
              <ConPermiso modulo="MetalurgicaProductos" accion="ver">
                <SidebarSubLink
                  href="/Metalurgica/Productos"
                  texto="Productos"
                  activo={esActivo('/Metalurgica/Productos')}
                />
              </ConPermiso>
              <ConPermiso modulo="MetalurgicaConfiguracion" accion="ver">
                <SidebarSubLink
                  href="/Metalurgica/Configuracion"
                  texto="Configuración"
                  activo={esActivo('/Metalurgica/Configuracion')}
                />
              </ConPermiso>
              <ConPermiso modulo="MetalurgicaRegistro" accion="ver">
                <SidebarSubLink
                  href="/Metalurgica/Registro"
                  texto="Registro Producción"
                  activo={esActivo('/Metalurgica/Registro')}
                />
              </ConPermiso>
            </div>
          </Show>

          <ConPermiso modulo="Inyeccion" accion="ver">
            <SidebarLink href="/Produccion/Inyeccion" texto="Inyección" activo={esActivo('/Produccion/Inyeccion')} />
          </ConPermiso>
          <ConPermiso modulo="Hojalateria" accion="ver">
            <SidebarLink href="/Produccion/Hojalateria" texto="Hojalatería" activo={esActivo('/Produccion/Hojalateria')} />
          </ConPermiso>
          <ConPermiso modulo="ProduccionDiaria" accion="ver">
            <SidebarLink href="/Produccion/ProduccionDiaria" texto="Producción Diaria" activo={esActivo('/Produccion/ProduccionDiaria')} />
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
