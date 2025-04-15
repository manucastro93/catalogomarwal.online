import { createSignal, createEffect, Show } from 'solid-js';

export default function ModalMensaje(props: {
  mensaje: string;
  cerrar: () => void;
}) {
  const [visible, setVisible] = createSignal(false);

  createEffect(() => {
    if (props.mensaje !== '') {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        props.cerrar();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  });

  return (
    <Show when={visible()}>
      <div class="fixed inset-0 flex items-start justify-center pt-[5%] z-50 bg-black/2">
        <div class="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-lg font-semibold border border-green-800">
          {props.mensaje}
        </div>
      </div>
    </Show>
  );
}
