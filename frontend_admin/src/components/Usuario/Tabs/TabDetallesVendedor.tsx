import type { Vendedor } from '../../../types/vendedor';

export default function TabDetallesVendedor(props: { vendedor: Vendedor }) {
  const { vendedor } = props;

  return (
    <div class="space-y-3 text-base">
      <div>
        <span class='font-bold'>Nombre: </span>{vendedor.nombre}
      </div>
      <div>
        <span class='font-bold'>Email: </span>{vendedor.email}
      </div>
      <div>
        <span class='font-bold'>Teléfono: </span>{vendedor.telefono || '-'}
      </div>
    </div>
  );
}
