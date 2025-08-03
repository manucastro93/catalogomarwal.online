import type { Operario } from '@/types/operario';

export default function VerOperarioModal(props: {
  abierto: boolean;
  operario?: Operario | null;
  onCerrar: () => void;
}) {
  if (!props.abierto || !props.operario) return null;
  const { codigo, nombre, apellido, rubro, createdAt } = props.operario;

  return (
    <div class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-xl p-8 min-w-[320px] w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Ver Operario</h2>
        <div class="space-y-2">
          <div><span class="font-medium">Código:</span> {codigo}</div>
          <div><span class="font-medium">Nombre:</span> {nombre}</div>
          <div><span class="font-medium">Apellido:</span> {apellido}</div>
          <div><span class="font-medium">Rubro:</span> {rubro?.nombre || '-'}</div>
        </div>
        <div class="flex justify-end mt-6">
          <button class="text-gray-600 hover:underline" onClick={props.onCerrar}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
