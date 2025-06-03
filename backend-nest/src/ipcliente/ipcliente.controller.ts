import { IpClienteCliente } from '@/models';

export const vincularIpConCliente = async (ipClienteId, clienteId) => {
  const yaExiste = await IpClienteCliente.findOne({ where: { ipClienteId, clienteId } });

  if (!yaExiste) {
    await IpClienteCliente.create({ ipClienteId, clienteId });
    console.log(`✅ IP ${ipClienteId} vinculada al cliente ${clienteId}`);
  }
};
