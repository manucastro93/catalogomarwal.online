import { createSignal } from 'solid-js';

const [notificaciones, setNotificaciones] = createSignal<string[]>([]);

export const useNotificaciones = () => {
  const agregarNotificacion = (mensaje: string) => {
    setNotificaciones([...notificaciones(), mensaje]);
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  return {
    notificaciones,
    agregarNotificacion,
    limpiarNotificaciones
  };
};
