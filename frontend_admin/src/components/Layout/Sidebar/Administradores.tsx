import { Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { Users } from 'lucide-solid';

export default function Administradores(props: { usuario: any }) {
  const location = useLocation();
  const esActivo = (path: string) => location.pathname === path;

  return (
    <Show when={props.usuario?.rolUsuarioId === ROLES_USUARIOS.SUPREMO}>
      <ConPermiso modulo="Administradores" accion="ver">
        <A href="/Administradores" class="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 transition"
          classList={{ 'bg-gray-700 font-bold': esActivo('/Administradores') }}>
          <Users size={16} /> Usuarios Admin
        </A>
      </ConPermiso>
    </Show>
  );
}
