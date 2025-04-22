import { HistorialCliente, Provincia, Localidad } from '../models/index.js';

export const registrarHistorialCliente = async (clienteAnterior, clienteNuevo, usuarioId) => {
  const campos = [
    'nombre',
    'telefono',
    'email',
    'razonSocial',
    'direccion',
    'provinciaId',
    'localidadId',
    'cuit_cuil',
  ];

  for (const campo of campos) {
    const valorAnteriorRaw = clienteAnterior[campo];
    const valorNuevoRaw = clienteNuevo[campo];

    let valorAnterior = valorAnteriorRaw?.toString() || '';
    let valorNuevo = valorNuevoRaw?.toString() || '';

    // Para provinciaId: guardamos el nombre, no el ID
    if (campo === 'provinciaId') {
      const provAnt = valorAnteriorRaw
        ? await Provincia.findByPk(valorAnteriorRaw)
        : null;
      const provNew = valorNuevoRaw
        ? await Provincia.findByPk(valorNuevoRaw)
        : null;
      valorAnterior = provAnt?.nombre || '';
      valorNuevo = provNew?.nombre || '';
    }

    // Para localidadId: guardamos el nombre, no el ID
    if (campo === 'localidadId') {
      const locAnt = valorAnteriorRaw
        ? await Localidad.findByPk(valorAnteriorRaw)
        : null;
      const locNew = valorNuevoRaw
        ? await Localidad.findByPk(valorNuevoRaw)
        : null;
      valorAnterior = locAnt?.nombre || '';
      valorNuevo = locNew?.nombre || '';
    }

    // Solo creamos el registro si hubo cambio real
    if (valorAnterior !== valorNuevo) {
      await HistorialCliente.create({
        campo,
        valorAnterior,
        valorNuevo,
        clienteId: clienteNuevo.id,
        usuarioId: usuarioId || null,
      });
    }
  }
};
