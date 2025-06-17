import { Cliente, Provincia, Localidad, HistorialCliente } from '../models/index.js';
import { geocodificarDireccionExtendida } from '../utils/geocodificacion.js';

export const crearClienteConGeocodificacion = async (clienteData, vendedorId = null) => {
  const { nombre, telefono, email, razonSocial, direccion, cuit_cuil, localidad, provincia } = clienteData;
  const direccionCompleta = `${direccion}, Argentina`;
  const { latitud, longitud } = await geocodificarDireccionExtendida(direccionCompleta);

  let provinciaDb = await Provincia.findOne({ where: { nombre: provincia } });
  if (!provinciaDb) provinciaDb = await Provincia.create({ nombre: provincia });

  let localidadDb = await Localidad.findOne({ where: { nombre: localidad, provinciaId: provinciaDb.id } });
  if (!localidadDb) localidadDb = await Localidad.create({ nombre: localidad, provinciaId: provinciaDb.id });

  return Cliente.create({
    nombre,
    telefono,
    email,
    razonSocial,
    direccion,
    provinciaId: provinciaDb.id,
    localidadId: localidadDb.id,
    cuit_cuil,
    vendedorId,
    latitud,
    longitud,
  });
};

export const actualizarClienteExistenteConGeocodificacion = async (clienteExistente, clienteData, usuarioId) => {
  const { nombre, telefono, email, razonSocial, direccion, cuit_cuil, vendedorId, localidad, provincia } = clienteData;

  const direccionCompleta = `${direccion}, Argentina`;
  const { latitud, longitud } = await geocodificarDireccionExtendida(direccionCompleta);

  let provinciaDb = await Provincia.findOne({ where: { nombre: provincia } });
  if (!provinciaDb) provinciaDb = await Provincia.create({ nombre: provincia });

  let localidadDb = await Localidad.findOne({ where: { nombre: localidad, provinciaId: provinciaDb.id } });
  if (!localidadDb) localidadDb = await Localidad.create({ nombre: localidad, provinciaId: provinciaDb.id });

  for (const campo of ['nombre','telefono','email','razonSocial','direccion','cuit_cuil','vendedorId']) {
    if (clienteExistente[campo] !== clienteData[campo]) {
      await HistorialCliente.create({
        campo,
        valorAnterior: clienteExistente[campo]?.toString(),
        valorNuevo: clienteData[campo]?.toString(),
        clienteId: clienteExistente.id,
        usuarioId,
      });
    }
  }

  await clienteExistente.update({
    nombre,
    telefono,
    email,
    razonSocial,
    direccion,
    provinciaId: provinciaDb.id,
    localidadId: localidadDb.id,
    cuit_cuil,
    vendedorId,
    latitud,
    longitud,
  });

  return clienteExistente;
};
