import { ConfiguracionSistema } from '../models/index.js';

export const listarConfiguraciones = async (req, res, next) => {
  try {
    const configuraciones = await ConfiguracionSistema.findAll();
    res.json(configuraciones);
  } catch (error) {
    next(error);
  }
};

export const crearConfiguracion = async (req, res, next) => {
  try {
    const { clave, valor, descripcion } = req.body;

    const existente = await ConfiguracionSistema.findOne({ where: { clave } });
    if (existente) {
      return res.status(400).json({ error: 'Ya existe una configuración con esa clave.' });
    }

    const nueva = await ConfiguracionSistema.create({ clave, valor, descripcion });
    res.status(201).json(nueva);
  } catch (error) {
    next(error);
  }
};

export const editarConfiguracion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { valor, descripcion } = req.body;

    const configuracion = await ConfiguracionSistema.findByPk(id);
    if (!configuracion) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }

    configuracion.valor = valor;
    configuracion.descripcion = descripcion;
    await configuracion.save();

    res.json(configuracion);
  } catch (error) {
    next(error);
  }
};

export const eliminarConfiguracion = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const configuracion = await ConfiguracionSistema.findByPk(id);
    if (!configuracion) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }

    await configuracion.destroy();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const obtenerConfiguracionPorClave = async (req, res, next) => {
  try {
    const { clave } = req.params;

    const configuracion = await ConfiguracionSistema.findOne({
      where: { clave },
    });

    if (!configuracion) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }

    res.json(configuracion);
  } catch (error) {
    next(error);
  }
};
