import { createSignal } from 'solid-js';
import type { Usuario } from '../types/usuario';
import { useNavigate } from '@solidjs/router';

const [usuario, setUsuario] = createSignal<Usuario | null>(null);
const [token, setToken] = createSignal<string | null>(null);

export const useAuth = () => {
  const navigate = useNavigate();

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return { usuario, token, login, logout };
};

export const login = (userData: Usuario, authToken: string) => {
  setUsuario(userData);
  setToken(authToken);
  localStorage.setItem('authToken', authToken);
  localStorage.setItem('usuario', JSON.stringify(userData));
};

export const checkLocalStorage = () => {
  const savedUser = localStorage.getItem('usuario');
  const savedToken = localStorage.getItem('authToken');
  if (savedUser && savedToken) {
    setUsuario(JSON.parse(savedUser));
    setToken(savedToken);
  }
};
