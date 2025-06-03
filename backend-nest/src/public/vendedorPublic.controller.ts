import { Usuario } from '@/models';

export const buscarVendedorPorLink = async (req, res, next) => {
  try {
    const { link } = req.params;

    const vendedor = await Usuario.findOne({
      where: {
        link,
        rolUsuarioId: 3, // ROLES_USUARIO.VENDEDOR
      },
      attributes: ['id', 'nombre', 'email', 'telefono', 'link'],
    });

    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    res.json(vendedor);
  } catch (error) {
    console.error('❌ Error en buscarVendedorPorLink:', error);
    next(error);
  }
};
