import { Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { obtenerVendedorGuardado } from '../services/vendedor.service';

export default function RutaProtegida(props: { children: any }) {
  const vendedor = obtenerVendedorGuardado();

  return (
    <Show when={vendedor} fallback={<Navigate href="/sin-acceso" />}>
      {props.children}
    </Show>
  );
}
