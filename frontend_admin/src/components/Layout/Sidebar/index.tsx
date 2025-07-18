import { A, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { useAuth } from "@/store/auth";
import Logo from "./Logo";
import Ventas from "./Ventas";
import Compras from "./Compras";
import Produccion from "./Produccion";
import Bot from "./Bot";
import Informes from "./Informes";
import BaseDatos from "./BaseDatos";
import Configuracion from "./Configuracion";
import { Home } from "@/icons";
import theme from "@/styles/sidebarTheme";

export default function Sidebar(props: {
  expandido: boolean;
  setExpandido: (val: boolean) => void;
}) {
  const location = useLocation();
  const { usuario } = useAuth();

  if (!usuario()) return null;

  return (
    <aside
      onMouseEnter={() => props.setExpandido(true)}
      onMouseLeave={() => props.setExpandido(false)}
      class={`sidebar-scroll scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent
        overflow-y-auto transition-all duration-300 fixed top-0 left-0 z-50 h-screen bg-[#252C37] border-r border-[#1e293b] flex flex-col
        ${props.expandido ? "w-64" : "w-16"}`}
    >
      <div class="px-2 py-2 border-b border-[#334155]">
        <Logo expandido={props.expandido} />
      </div>

      <nav
        class={`flex-1 overflow-y-auto ${theme.fuente} text-sm scrollbar-thin scrollbar-thumb-zinc-700`}
      >
        <SeccionTitulo texto="GENERAL" mostrar={props.expandido} />
        <SidebarLink
          href="/Inicio"
          icon={<Home class="w-5 h-5 text-white" />}
          texto="INICIO"
          actual={location.pathname === "/Inicio"}
          expandido={props.expandido}
        />

        <SeccionTitulo texto="GESTIÓN" mostrar={props.expandido} classExtra="mt-4" />
        <Ventas usuario={usuario()} expandido={props.expandido} />
        <Compras usuario={usuario()} expandido={props.expandido} />
        <Produccion usuario={usuario()} expandido={props.expandido} />
        <Bot usuario={usuario()} expandido={props.expandido} />

        <SeccionTitulo texto="ANÁLISIS" mostrar={props.expandido} classExtra="mt-4" />
        <Informes expandido={props.expandido} />

        <SeccionTitulo texto="BASE DE DATOS" mostrar={props.expandido} classExtra="mt-4" />
        <BaseDatos expandido={props.expandido} />
        
         <SeccionTitulo texto="CONFIGURACIÓN" mostrar={props.expandido} classExtra="mt-4" />
        <Configuracion expandido={props.expandido} />
      </nav>
    </aside>
  );
}

function SeccionTitulo(props: {
  texto: string;
  mostrar: boolean;
  classExtra?: string;
}) {
  return (
    <div
      class={`text-[9px] tracking-widest font-medium px-4 py-2 text-[#60a5fa] ${
        props.classExtra || ""
      }`}
    >
      {props.mostrar ? props.texto : "•••"}
    </div>
  );
}

function SidebarLink(props: {
  href: string;
  icon: any;
  texto: string;
  actual: boolean;
  expandido: boolean;
}) {
  return (
    <A
      href={props.href}
      class={`group flex items-center transition-all duration-200 ${theme.paddingY} ${theme.redondeado} ${
        props.actual ? "bg-zinc-800" : "hover:bg-zinc-700"
      }`}
      style={{ color: theme.texto }}
    >
      <div class="w-16 flex justify-center items-center">{props.icon}</div>
      <Show when={props.expandido}>
        <span>{props.texto}</span>
      </Show>
    </A>
  );
}
