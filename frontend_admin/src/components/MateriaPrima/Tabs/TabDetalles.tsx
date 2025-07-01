import type { MateriaPrima } from '@/types/materiaPrima';

export default function TabDetalles(props: { materiaPrima: MateriaPrima }) {
  const m = props.materiaPrima;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div><strong>SKU:</strong> {m.sku}</div>
      <div><strong>Subcategoría:</strong> {m.Subcategoria?.nombre || '—'}</div>
      <div class="md:col-span-2"><strong>Descripción:</strong> {m.descripcion || 'No tiene.'}</div>
      <div><strong>Activo:</strong> {m.activo ? 'Sí' : 'No'}</div>
      <div><strong>Stock:</strong> {m.stock}</div>
      <div><strong>Peso:</strong> {m.peso ?? '—'}</div>
      <div><strong>Largo:</strong> {m.largo ?? '—'}</div>
      <div><strong>Ancho:</strong> {m.ancho ?? '—'}</div>
      <div><strong>Alto:</strong> {m.alto ?? '—'}</div>
    </div>
  );
}
