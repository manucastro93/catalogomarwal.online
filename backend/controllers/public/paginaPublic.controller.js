import { Op } from 'sequelize';
import { Pagina, Banner } from '../../models/index.js';
import cache from '../../utils/cache.js';

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
    console.error('❌ Error en obtenerPaginaPublica:', error);
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
    console.error('❌ Error en listarBanners:', error);
    next(error);
  }
};
