import { JSX } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { useAuth } from '../store/auth';

export default function ProtectedRoute(props: { children: JSX.Element }) {
  const { usuario } = useAuth();

  return usuario() ? props.children : <Navigate href="/login" />;
}
