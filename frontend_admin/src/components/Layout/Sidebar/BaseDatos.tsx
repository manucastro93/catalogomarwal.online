import { Show, createSignal, For } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Database, ChevronDown, ChevronUp } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function BaseDatos(props: { expandido: boolean }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/BaseDatos'));
  const [ventasOpen, setVentasOpen] = createSignal(false);
  const [produccionOpen, setProduccionOpen] = createSignal(false);
  // Para los submenús de Producción (Inyección, Metalúrgica, Hojalatería)
  const [inyeccionOpen, setInyeccionOpen] = createSignal(false);
  const [metalurgicaOpen, setMetalurgicaOpen] = createSignal(false);
  const [hojalateriaOpen, setHojalateriaOpen] = createSignal(false);

  const esActivo = (path: string) => location.pathname === path;

  // Subitems de cada sección
  const ventasLinks = [
    {
      permiso: "BaseDatos_Ventas_Clientes",
      href: "/BaseDatos/Clientes",
      texto: "Clientes"
    },
    {
      permiso: "BaseDatos_Ventas_Productos",
      href: "/BaseDatos/Productos",
      texto: "Productos"
    },
    {
      permiso: "BaseDatos_Ventas_Categorias",
      href: "/BaseDatos/Categorias",
      texto: "Categorías"
    },
    {
      permiso: "BaseDatos_Ventas_Vendedores",
      href: "/BaseDatos/Vendedores",
      texto: "Vendedores"
    }
  ];

  // Ejemplo de estructura reutilizable para producción
  const produccionLinks = [
    {
      label: "Operarios",
      permiso: "BaseDatos_Produccion_Operarios",
      href: "/BaseDatos/Operarios"
    }
  ];

  // Submenú anidados bajo producción:
  const submenusProduccion = [
    {
      label: "Inyección",
      open: inyeccionOpen,
      setOpen: setInyeccionOpen,
      links: [
        {
          permiso: "BaseDatos_Produccion_Inyeccion_Piezas",
          href: "/BaseDatos/Inyeccion/Piezas",
          texto: "Piezas"
        }
        // Podés sumar más acá
      ]
    },
    {
      label: "Metalúrgica",
      open: metalurgicaOpen,
      setOpen: setMetalurgicaOpen,
      links: [
        {
          permiso: "BaseDatos_Produccion_Metalurgica",
          href: "/BaseDatos/Metalúrgica/",
          texto: "Sección Metalúrgica"
        }
        // Podés sumar más acá
      ]
    },
    {
      label: "Hojalatería",
      open: hojalateriaOpen,
      setOpen: setHojalateriaOpen,
      links: [
        {
          permiso: "BaseDatos_Produccion_Hojalateria",
          href: "/BaseDatos/Hojalatería",
          texto: "Sección Hojalatería"
        }
        // Podés sumar más acá
      ]
    }
  ];

  return (
    <div class="text-sm font-medium tracking-wide">
      <button
        onClick={() => setOpen(!open())}
        class={`${theme.itemBase} ${theme.paddingY} ${theme.redondeado} ${open() ? theme.itemActivo : theme.itemHover}`}
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
              <For each={ventasLinks}>
                {({ permiso, href, texto }) => (
                  <ConPermiso modulo={permiso} accion="ver">
                    <SidebarSubLink href={href} texto={texto} activo={esActivo(href)} />
                  </ConPermiso>
                )}
              </For>
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

              {/* Operarios */}
              <For each={produccionLinks}>
                {({ permiso, href, label }) => (
                  <ConPermiso modulo={permiso} accion="ver">
                    <SidebarSubLink href={href} texto={label} activo={esActivo(href)} />
                  </ConPermiso>
                )}
              </For>

              {/* Submenús anidados: Inyección, Metalúrgica, Hojalatería */}
              <For each={submenusProduccion}>
                {(submenu) => (
                  <>
                    <button
                      onClick={() => submenu.setOpen(!submenu.open())}
                      class={`${theme.paddingSubitem} ml-3 text-left ${theme.textoSubitem}`}
                    >
                      {submenu.label}
                      <Show when={submenu.open()}>
                        <ChevronUp class="inline ml-2" size={14} />
                      </Show>
                      <Show when={!submenu.open()}>
                        <ChevronDown class="inline ml-2" size={14} />
                      </Show>
                    </button>
                    <Show when={submenu.open()}>
                      <div class="flex flex-col ml-5">
                        <For each={submenu.links}>
                          {({ permiso, href, texto }) => (
                            <ConPermiso modulo={permiso} accion="ver">
                              <SidebarSubLink href={href} texto={texto} activo={esActivo(href)} />
                            </ConPermiso>
                          )}
                        </For>
                      </div>
                    </Show>
                  </>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

// Subitem reutilizable
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
