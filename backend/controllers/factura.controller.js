import { Op } from 'sequelize';
import { Factura, EstadoFactura } from '../models/index.js';

export const listarFacturas = async (req, res, next) => {
  try {
    const {
      buscar = '',
      fechaDesde,
      fechaHasta,
      estadoFacturaId,
      pagina = 1,
      limit = 50,
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limit);

    const where = {};

    if (buscar) {
      where[Op.or] = [
        { apellido_razon_soc: { [Op.like]: `%${buscar}%` } },
        { nombre: { [Op.like]: `%${buscar}%` } },
        { cuit: { [Op.like]: `%${buscar}%` } },
      ];
    }

    if (fechaDesde && fechaHasta) {
      where.fecha_comp = {
        [Op.between]: [new Date(fechaDesde), new Date(fechaHasta)],
      };
    }

    if (estadoFacturaId) {
      where.estadoFacturaId = estadoFacturaId;
    }

    const { count, rows } = await Factura.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['fecha_comp', 'DESC']],
      include: [
        {
          model: EstadoFactura,
          as: 'estado',
          attributes: ['id', 'nombre'],
        },
      ],
    });

    res.json({
      data: rows,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      hasNextPage: offset + rows.length < count,
      hasPrevPage: offset > 0,
    });
  } catch (error) {
    console.error('❌ Error al listar facturas:', error);
    next(error);
  }
};
