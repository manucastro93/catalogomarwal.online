import { Op } from 'sequelize';
import { Factura, EstadoFactura, PersonalDux, DetalleFactura } from '../models/index.js';

export const listarFacturas = async (req, res, next) => {
  try {
    const {
      buscar = '',
      fechaDesde,
      fechaHasta,
      estadoFacturaId,
      pagina = 1,
      limit = 50,
      vendedorId
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

    if (vendedorId) {
      where.id_vendedor = vendedorId;
    }

    const { count, rows } = await Factura.findAndCountAll({
      where,
      include: [
        {
          model: PersonalDux,
          as: "personal"
        },
        {
          model: EstadoFactura,
          as: 'estado',
          attributes: ['id', 'nombre'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['fecha_comp', 'DESC']],
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

export const obtenerDetallesFactura = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const detalles = await DetalleFactura.findAll({
      where: { facturaId: id },
      attributes: [
        'codItem',
        'descripcion',
        'cantidad',
        'precioUnitario',
        'descuento',
        'costo',
        // 'subtotal' // opcional si querés devolverlo
      ],
      order: [['codItem', 'ASC']],
    });

    // Mapear al shape de DetalleFacturaDux (snake_case) que usás en el front
    const payload = detalles.map((d) => ({
      cod_item: d.codItem,
      item: d.descripcion,
      ctd: d.cantidad,
      precio_uni: d.precioUnitario,
      porc_desc: d.descuento ?? 0,
      porc_iva: 0,              // si no tenés IVA por ítem, devuelvo 0
      comentarios: null,
      costo: d.costo ?? null,
    }));

    res.json(payload);
  } catch (error) {
    console.error('❌ Error al obtener detalles de factura:', error);
    next(error);
  }
};