import type { Cliente } from '@/types/cliente';

export default function TabDetallesCliente(props: { cliente: Cliente }) {
  const { cliente } = props;

  return (
    <div class="grid grid-cols-2 gap-6 text-base">
      <div>
        <p class="font-semibold text-gray-700 text-lg">Nombre</p>
        <p>{cliente.nombre || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Teléfono</p>
        <p>{cliente.telefono || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Email</p>
        <p>{cliente.email || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">CUIT / CUIL</p>
        <p>{cliente.cuit_cuil || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Razón social</p>
        <p>{cliente.razonSocial || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Dirección</p>
        <p>{cliente.direccion || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Provincia</p>
        <p>{cliente.provincia?.nombre || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Localidad</p>
        <p>{cliente.localidad?.nombre || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Vendedor asignado</p>
        <p>{cliente.vendedor?.nombre || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Creado el</p>
        <p>{new Date(cliente.createdAt || '').toLocaleString()}</p>
      </div>
    </div>
  );
}
