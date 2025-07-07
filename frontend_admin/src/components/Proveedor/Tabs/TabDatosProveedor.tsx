import type { Proveedor } from '@/types/proveedor';

export default function TabDatosProveedor(props: { proveedor: Proveedor }) {
  const { proveedor } = props;

  return (
    <div class="grid grid-cols-2 gap-6 text-base">
      <div>
        <p class="font-semibold text-gray-700 text-lg">Nombre</p>
        <p>{proveedor.nombre || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Teléfono</p>
        <p>{proveedor.telefono || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Email</p>
        <p>{proveedor.email || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Tipo Doc</p>
        <p>{proveedor.tipoDoc || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Nro Doc</p>
        <p>{proveedor.nroDoc || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Dirección</p>
        <p>{proveedor.domicilio || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Provincia</p>
        <p>{proveedor.provincia || '-'}</p>
      </div>
      <div>
        <p class="font-semibold text-gray-700 text-lg">Localidad</p>
        <p>{proveedor.localidad || '-'}</p>
      </div>
      <div class="col-span-2">
        <p class="font-semibold text-gray-700 text-lg">Creado el</p>
        <p>{new Date(proveedor.createdAt || '').toLocaleString()}</p>
      </div>
    </div>
  );
}
