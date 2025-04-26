import { EstadoPedido } from '../models/index.js';

export const listarEstadosPedido = async (req, res, next) => {
  try {
    const estados = await EstadoPedido.findAll({ order: [['id', 'ASC']] });
    res.json(estados);
  } catch (error) {
    next(error);
  }
};

export const crearEstadoPedido = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const nuevo = await EstadoPedido.create({ nombre, descripcion });
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const estado = await EstadoPedido.findByPk(id);
    if (!estado) return res.status(404).json({ mensaje: 'Estado no encontrado' });
    await estado.update({ nombre, descripcion });
    res.json(estado);
  } catch (error) {
    next(error);
  }
};

export const eliminarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const estado = await EstadoPedido.findByPk(id);
    if (!estado) return res.status(404).json({ mensaje: 'Estado no encontrado' });
    await estado.destroy();
    res.json({ mensaje: 'Estado eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
