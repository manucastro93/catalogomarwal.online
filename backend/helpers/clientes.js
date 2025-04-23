import { Cliente, Provincia, Localidad } from '../models/index.js';
import { geocodificarDireccion } from '../utils/geocodificacion.js';

export const crearClienteConGeocodificacion = async (clienteData, vendedorId = null) => {
  const {
    nombre, telefono, email, razonSocial,
    direccion, provinciaId, localidadId, cuit_cuil
  } = clienteData;

  const provinciaNombre = provinciaId ? ((await Provincia.findByPk(provinciaId))?.nombre || '').replace('-GBA', '').trim(): '';
  const localidadNombre = localidadId ? (await Localidad.findByPk(localidadId))?.nombre : '';
  const direccionCompleta = `${direccion}, ${localidadNombre}, ${provinciaNombre}, Argentina`;

  const { latitud, longitud } = await geocodificarDireccion(direccionCompleta);

  const cliente = await Cliente.create({
    nombre, telefono, email, razonSocial, direccion,
    provinciaId: provinciaId || null,
    localidadId: localidadId || null,
    cuit_cuil,
    vendedorId: vendedorId || null,
    latitud, longitud,
  });

  return cliente;
};
