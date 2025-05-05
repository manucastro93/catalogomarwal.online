import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { ChartLine, ChevronDown, ChevronUp } from 'lucide-solid';

export default function Graficos() {
  const location = useLocation();
  const [open, setOpen] = createSignal(location.pathname.startsWith('/Graficos'));

  const esActivo = (path: string) => location.pathname === path;

  return (
    <ConPermiso modulo="Graficos" accion="ver">
      <div>
        <button onClick={() => setOpen(!open())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
          <span class="flex items-center gap-2"><ChartLine size={16} /> Gráficos</span>
          {open() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <Show when={open()}>
          <div class="ml-10 flex flex-col gap-1 mt-1">
            <A href="/Graficos/ResumenProduccion" classList={{ 'text-blue-400 font-semibold': esActivo('/Graficos/Produccion') }}>
              Producción
            </A>
            
          </div>
        </Show>
        
      </div>
    </ConPermiso>
  );
}
