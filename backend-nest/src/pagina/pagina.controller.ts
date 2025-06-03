import { Pagina, Banner } from '@/models';
import path from 'path';
import cache from '@/utils/cache';
import { crearAuditoria } from '@/utils/auditoria';

export const obtenerPagina = async (req, res, next) => {
  try {
    const cacheKey = 'pagina';
    const cached = cache.get(cacheKey);
    if (cached) return reson(cached);

    let pagina = await Pagina.findOne({
      include: [{ model: Banner, as: 'Banners' }],
    });

    if (!pagina) {
      pagina = await Pagina.create({ logo: '' });
    }

    cache.set(cacheKey, pagina);
    reson(pagina);
  } catch (error) {
    next(error);
  }
};

export const actualizarPagina = async (req, res, next) => {
  try {
    const pagina = await Pagina.findOne();
    if (!pagina) return res.status(404)on({ message: 'Datos de página no encontrados' });

    await pagina.update(req.body);

    cache.del('pagina');
    reson(pagina);
  } catch (error) {
    next(error);
  }
};

export const subirLogo = async (req, res, next) => {
  try {
    const pagina = await Pagina.findOne();
    if (!pagina) return res.status(404)on({ message: 'Datos de página no encontrados' });

    if (!req.file) return res.status(400)on({ message: 'No se recibió ningún archivo' });

    pagina.logo = `/uploads/logo/${req.file.filename}`;
    await pagina.save();
    
    cache.del('pagina');
    reson({ message: 'Logo actualizado correctamente', logo: pagina.logo });
  } catch (error) {
    next(error);
  }
};

export const listarBanners = async (req, res, next) => {
  try {
    const cacheKey = 'bannersActivos';
    const cached = cache.get(cacheKey);
    if (cached) return reson(cached);

    const banners = await Banner.findAll({ order: [['orden', 'ASC']] });
    cache.set(cacheKey, banners);
    reson(banners);
  } catch (error) {
    next(error);
  }
};

export const crearBanner = async (req, res, next) => {
  try {
    const { orden, fechaInicio, fechaFin } = req.body;
    if (!req.file || !orden) {
      return res.status(400)on({ message: 'La imagen y el orden son obligatorios' });
    }

    const pagina = await Pagina.findOne();
    if (!pagina) return res.status(404)on({ message: 'No se encontró la página' });

    const imagen = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      imagen,
      orden,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      paginaId: pagina.id,
    });
    
    await crearAuditoria({
      tabla: 'banners',
      accion: 'crea banner',
      registroId: banner.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó un banner`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    

    cache.del('bannersActivos');
    res.status(201)on({ message: 'Banner creado correctamente', banner });
  } catch (error) {
    next(error);
  }
};

export const actualizarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404)on({ message: 'Banner no encontrado' });

    await banner.update(req.body);
    
    await crearAuditoria({
      tabla: 'banners',
      accion: 'actualiza banner',
      registroId: banner.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se actualizó el banner`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.del('bannersActivos');
    reson({ message: 'Banner actualizado correctamente', banner });
  } catch (error) {
    next(error);
  }
};

export const eliminarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404)on({ message: 'Banner no encontrado' });

    await banner.destroy();
    
    await crearAuditoria({
      tabla: 'banners',
      accion: 'elimina banner',
      registroId: banner.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se eliminó el banner`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.del('bannersActivos');
    reson({ message: 'Banner eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
