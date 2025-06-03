import { Op } from 'sequelize';
import { Pagina, Banner } from '@/models';
import cache from '@/utils/cache';

export const obtenerPaginaPublica = async (req, res, next) => {
  try {
    const cacheKey = 'pagina';
    const cached = cache.get(cacheKey);
    if (cached) return reson(cached);

    let pagina = await Pagina.findOne({ include: [{ model: Banner, as: 'Banners' }] });
    if (!pagina) pagina = await Pagina.create({ logo: '' });

    cache.set(cacheKey, pagina);
    reson(pagina);
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

    reson(banners);
  } catch (error) {
    console.error('❌ Error en listarBanners:', error);
    next(error);
  }
};
