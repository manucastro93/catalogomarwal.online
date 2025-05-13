import { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { useAuth } from '@/store/auth';
import { tienePermiso } from '@/utils/permisoUsuario';

interface Props {
  modulo: string;
  accion: string;
  children: JSX.Element;
}

export default function ConPermiso(props: Props) {
  const { permisos } = useAuth();
  const tiene = () =>
    props.modulo && props.accion
      ? tienePermiso(permisos(), props.modulo, props.accion)
      : false;
  return <Show when={tiene()}>{props.children}</Show>;
}
