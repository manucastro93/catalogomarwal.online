import { createSignal, createEffect, Show } from 'solid-js';
import {
  sincronizarProductosDesdeDux,
  obtenerProgresoSync,
} from '@/services/producto.service';

export default function BotonSyncDux(props: { onFinalizar: () => void }) {
  const [progreso, setProgreso] = createSignal(0);
  const [cargando, setCargando] = createSignal(false);
  const [error, setError] = createSignal('');

  const iniciarSync = async () => {
    setCargando(true);
    setProgreso(0);
    setError('');

    const intervalo = setInterval(async () => {
      try {
        const r = await obtenerProgresoSync();
        if (r?.porcentaje !== undefined) {
          setProgreso(r.porcentaje);
        }
        if (r?.porcentaje >= 100) {
          clearInterval(intervalo);
          setCargando(false);
          setProgreso(100);
          props.onFinalizar();
          setTimeout(() => setProgreso(0), 2000);
        }
      } catch {
        clearInterval(intervalo);
        setError('Error al consultar progreso');
        setCargando(false);
        setTimeout(() => setError(''), 3000);
      }
    }, 1500);

    try {
      await sincronizarProductosDesdeDux();
    } catch {
      clearInterval(intervalo);
      setError('Error al sincronizar');
      setCargando(false);
    }
  };

  return (
    <div class="relative">
      <button
        onClick={iniciarSync}
        disabled={cargando()}
        class="bg-yellow-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 relative overflow-hidden w-[220px]"
      >
        {cargando()
          ? `Sincronizando... ${progreso()}%`
          : 'Sincronizar desde Dux'}
        <div
          class="absolute bottom-0 left-0 h-1 bg-green-400 transition-all duration-300"
          style={{ width: `${progreso()}%` }}
        />
      </button>
      <Show when={error()}>
        <p class="text-sm text-red-600 mt-1">{error()}</p>
      </Show>
    </div>
  );
}
