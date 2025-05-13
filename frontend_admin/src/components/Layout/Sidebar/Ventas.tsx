import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Package, ChevronDown, ChevronUp } from 'lucide-solid';
import { esOperario } from './utils';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';

export default function Ventas(props: { usuario: any }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);

  const esActivo = (path: string) => location.pathname === path;

  if (esOperario(props.usuario?.rolUsuarioId))
      return null;

  return (
    <div>
      <button onClick={() => setOpen(!open())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
        <span class="flex items-center gap-2"><Package size={16} /> Ventas</span>
        {open() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <Show when={open()}>
        <div class="ml-10 flex flex-col gap-1 mt-1">
          <Show when={!esOperario(props.usuario?.rolUsuarioId)}>
            <ConPermiso modulo="Pedidos" accion="ver">
              <A href="/Pedidos" classList={{ 'text-blue-400': esActivo('/Pedidos') }}>Pedidos</A>
            </ConPermiso>
          </Show>
          <ConPermiso modulo="Productos" accion="ver">
            <A href="/Productos" classList={{ 'text-blue-400': esActivo('/Productos') }}>Productos</A>
          </ConPermiso>
          <Show when={!esOperario(props.usuario?.rolUsuarioId)}>
            <ConPermiso modulo="Categorias" accion="ver">
              <A href="/Categorias" classList={{ 'text-blue-400': esActivo('/Categorias') }}>Categorías</A>
            </ConPermiso>
            <ConPermiso modulo="Clientes" accion="ver">
              <A href="/Clientes" classList={{ 'text-blue-400': esActivo('/Clientes') }}>Clientes</A>
            </ConPermiso>
          </Show>
          <Show when={[ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(props.usuario?.rolUsuarioId)}>
            <ConPermiso modulo="Vendedores" accion="ver">
              <A href="/Vendedores" classList={{ 'text-blue-400': esActivo('/Vendedores') }}>Vendedores</A>
            </ConPermiso>
          </Show>
          <Show when={[ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(props.usuario?.rolUsuarioId)}>
            <ConPermiso modulo="LogsCliente" accion="ver">
              <A href="/LogsCliente" classList={{ 'text-blue-400': esActivo('/LogsCliente') }}>Actividad Clientes</A>
            </ConPermiso>
          </Show>
          <ConPermiso modulo="Estadisticas" accion="ver">
                <A href="/Estadisticas" classList={{ 'text-blue-400': esActivo('/Estadisticas') }}>Resumen del mes</A>
            </ConPermiso>
        </div>
      </Show>
    </div>
  );
}
