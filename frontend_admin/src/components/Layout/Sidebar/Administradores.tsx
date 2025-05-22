import { Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { Users } from '@/icons';
import theme from '@/styles/sidebarTheme';

export default function Administradores(props: { usuario: any; expandido: boolean }) {
  const location = useLocation();
  const esActivo = (path: string) => location.pathname === path;

  return (
    <Show when={props.usuario?.rolUsuarioId === ROLES_USUARIOS.SUPREMO}>
      <ConPermiso modulo="Administradores" accion="ver">
        <A
          href="/Administradores"
          class={`${theme.itemBase} ${theme.paddingY} ${theme.redondeado} ${
            esActivo('/Administradores') ? theme.itemActivo : theme.itemHover
          }`}
          style={{ color: theme.texto }}
        >
          <div class={theme.itemIconoWrapper}>
            <Users size={18} />
          </div>
          <Show when={props.expandido}>
            <span class={theme.itemTexto}>Usuarios Admin</span>
          </Show>
        </A>
      </ConPermiso>
    </Show>
  );
}
