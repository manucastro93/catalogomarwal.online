import { EstadoFactura } from '@/models';

export const listarEstadosFactura = async (req, res, next) => {
  try {
    const estados = await EstadoFactura.findAll({
      attributes: ['id', 'nombre'],
      order: [['id', 'ASC']],
    });

    res.json(estados);
  } catch (error) {
    console.error('❌ Error al listar estados de factura:', error);
    next(error);
  }
};
