import { Pagina, Banner } from '../models/index.js';
import path from 'path';

export const obtenerPagina = async (req, res, next) => {
  try {
    let pagina = await Pagina.findOne({
      include: [{ model: Banner, as: 'Banners' }],
    });

    if (!pagina) {
      pagina = await Pagina.create({ logo: '' });
    }

    res.json(pagina);
  } catch (error) {
    next(error);
  }
};


export const actualizarPagina = async (req, res, next) => {
  try {
    const pagina = await Pagina.findOne();
    if (!pagina) return res.status(404).json({ message: 'Datos de página no encontrados' });

    await pagina.update(req.body);
    res.json(pagina);
  } catch (error) {
    next(error);
  }
};
export const subirLogo = async (req, res, next) => {
  try {
    const pagina = await Pagina.findOne();
    if (!pagina) return res.status(404).json({ message: 'Datos de página no encontrados' });

    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo' });

    pagina.logo = `/uploads/logo/${req.file.filename}`;
    await pagina.save();
    res.json({ message: 'Logo actualizado correctamente', logo: pagina.logo });
  } catch (error) {
    next(error);
  }
};



export const listarBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({ order: [['orden', 'ASC']] });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

export const crearBanner = async (req, res, next) => {
  try {
    const { orden, fechaInicio, fechaFin } = req.body;
    if (!req.file || !orden) {
      return res.status(400).json({ message: 'La imagen y el orden son obligatorios' });
    }

    const pagina = await Pagina.findOne(); // obtené la página existente
    if (!pagina) return res.status(404).json({ message: 'No se encontró la página' });

    const imagen = `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      imagen,
      orden,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      paginaId: pagina.id,
    });

    res.status(201).json({ message: 'Banner creado correctamente', banner });
  } catch (error) {
    next(error);
  }
};


export const actualizarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });

    await banner.update(req.body);
    res.json({ message: 'Banner actualizado correctamente', banner });
  } catch (error) {
    next(error);
  }
};

export const eliminarBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404).json({ message: 'Banner no encontrado' });

    await banner.destroy();
    res.json({ message: 'Banner eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
