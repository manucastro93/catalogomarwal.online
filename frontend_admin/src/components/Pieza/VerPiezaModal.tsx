import type { Pieza } from '@/types/pieza';
import { Show } from 'solid-js';

export default function VerPiezaModal(props: {
  pieza: Pieza | null;
  onCerrar: () => void;
}) {
  if (!props.pieza) return null;

  const p = props.pieza;

  return (
    <div class="fixed z-40 inset-0 bg-black/40 flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
        <button
          class="absolute top-4 right-4 text-gray-400 hover:text-black text-xl"
          onClick={props.onCerrar}
          aria-label="Cerrar"
        >✕</button>
        <h2 class="text-xl font-bold mb-2">Detalle de Pieza</h2>
        <div class="grid grid-cols-2 gap-4 text-base">
          <div>
            <span class="font-semibold text-gray-700">Código:</span>
            <div>{p.codigo}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Descripción:</span>
            <div>{p.descripcion || '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Categoría:</span>
            <div>{p.categoriaPieza?.nombre || p.categoria || '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Material:</span>
            <div>
              {p.materialObj
                ? `${p.materialObj.codigo} - ${p.materialObj.descripcion}`
                : p.material || '-'}
            </div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Rubro:</span>
            <div>{p.rubro?.nombre || p.rubroId || '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Cavidades:</span>
            <div>{p.cavidades ?? '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Pzs/Seg:</span>
            <div>{p.pzsXSeg ?? '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Ciclo/Seg:</span>
            <div>{p.cicloXSeg ?? '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Ciclos/Turno:</span>
            <div>{p.ciclosXTurno ?? '-'}</div>
          </div>
          <div>
            <span class="font-semibold text-gray-700">Peso:</span>
            <div>{p.peso ?? '-'}</div>
          </div>
          <div class="col-span-2">
            <span class="font-semibold text-gray-700">Colada:</span>
            <div>{p.colada || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
