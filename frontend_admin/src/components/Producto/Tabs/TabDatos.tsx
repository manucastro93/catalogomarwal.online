import type { Producto } from '@/types/producto';
import { formatearPrecio } from '@/utils/formato';

export default function TabDetalles(props: { producto: Producto }) {
  const p = props.producto;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div><strong>SKU:</strong> {p.sku}</div>
      <div><strong>Categoría:</strong> {p.Categoria?.nombre || '—'}</div>
      <div class="md:col-span-2"><strong>Descripción:</strong> {p.descripcion || 'No tiene.'}</div>
      <div><strong>Activo:</strong> {p.activo ? 'Sí' : 'No'}</div>
      <div><strong>Costo Materia Prima:</strong> {p.costoMP != null ? formatearPrecio(p.costoMP) : '—'}</div>
      <div><strong>Precio unitario:</strong> {formatearPrecio(p.precioUnitario)}</div>
      <div><strong>Precio por bulto:</strong> {p.precioPorBulto != null ? formatearPrecio(p.precioPorBulto) : '—'}</div>
      <div><strong>Unidades por bulto:</strong> {p.unidadPorBulto ?? '—'}</div>
    </div>
  );
}
