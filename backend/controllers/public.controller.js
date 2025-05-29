import {
  Banner,
  Usuario,
  Pagina,
} from '../models/index.js';
import { Op } from 'sequelize';
import cache from '../utils/cache.js';

// PÁGINA
export const obtenerPaginaPublica = async (req, res, next) => {
  try {
    const cacheKey = 'pagina';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let pagina = await Pagina.findOne({ include: [{ model: Banner, as: 'Banners' }] });
    if (!pagina) pagina = await Pagina.create({ logo: '' });

    cache.set(cacheKey, pagina);
    res.json(pagina);
  } catch (error) {
    next(error);
  }
};

export const listarBanners = async (req, res, next) => {
  try {
    const now = new Date();

    const banners = await Banner.findAll({
      where: {
        [Op.or]: [
          {
            fechaInicio: { [Op.lte]: now },
            fechaFin: { [Op.gte]: now },
          },
          {
            fechaInicio: null,
            fechaFin: null,
          },
        ],
      },
      order: [['orden', 'ASC']],
    });

    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// VENDEDOR
export const buscarVendedorPorLink = async (req, res, next) => {
  try {
    const { link } = req.params;

    const vendedor = await Usuario.findOne({
      where: {
        link,
        rolUsuarioId: ROLES_USUARIO.VENDEDOR,
      },
      attributes: ['id', 'nombre', 'email', 'telefono', 'link'],
    });

    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    res.json(vendedor);
  } catch (error) {
    next(error);
  }
};
