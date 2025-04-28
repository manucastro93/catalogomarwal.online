import { createSignal } from 'solid-js';
import type { Usuario } from '@/types/usuario';
import type { PermisoUsuario } from '@/types/permisoUsuario';

const [usuario, setUsuario] = createSignal<Usuario | null>(null);
const [token, setToken] = createSignal<string | null>(null);
const [permisos, setPermisos] = createSignal<PermisoUsuario[]>([]);

export const useAuth = () => {
  return { usuario, token, permisos, login, logout };
};

export const login = (userData: Usuario, authToken: string) => {
  setUsuario(userData);
  setToken(authToken);
  setPermisos(userData.permisos || []);
  localStorage.setItem('authToken', authToken);
  localStorage.setItem('usuario', JSON.stringify(userData));
};

export const logout = () => {
  setUsuario(null);
  setToken(null);
  setPermisos([]);
  localStorage.removeItem('authToken');
  localStorage.removeItem('usuario');
};

export const checkLocalStorage = () => {
  const savedUser = localStorage.getItem('usuario');
  const savedToken = localStorage.getItem('authToken');

  if (savedUser && savedToken) {
    const parsedUser: Usuario = JSON.parse(savedUser);
    setUsuario(parsedUser);
    setToken(savedToken);
    setPermisos(parsedUser.permisos || []);
  }
};

export const getToken = () => {
  return localStorage.getItem('authToken');
};
