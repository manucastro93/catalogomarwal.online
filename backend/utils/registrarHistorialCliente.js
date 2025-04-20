import { HistorialCliente } from '../models/index.js';

export const registrarHistorialCliente = async (clienteAnterior, clienteNuevo, usuarioId) => {
  const campos = [
    'nombre', 'telefono', 'email', 'razonSocial', 'direccion',
    'provinciaId', 'localidadId', 'cuit_cuil'
  ];

  for (const campo of campos) {
    const valorAnterior = clienteAnterior[campo];
    const valorNuevo = clienteNuevo[campo];

    if (valorAnterior != valorNuevo) {
      await HistorialCliente.create({
        campo,
        valorAnterior: valorAnterior?.toString() || '',
        valorNuevo: valorNuevo?.toString() || '',
        clienteId: clienteNuevo.id,
        usuarioId,
      });
    }
  }
};
