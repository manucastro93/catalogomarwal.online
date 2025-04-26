import { RolUsuario } from '../models/index.js';

export const listarRolesUsuario = async (req, res, next) => {
  try {
    const roles = await RolUsuario.findAll({ order: [['id', 'ASC']] });
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const crearRolUsuario = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const nuevo = await RolUsuario.create({ nombre, descripcion });
    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
};

export const actualizarRolUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    const rol = await RolUsuario.findByPk(id);
    if (!rol) return res.status(404).json({ mensaje: 'Rol no encontrado' });
    await rol.update({ nombre, descripcion });
    res.json(rol);
  } catch (error) {
    next(error);
  }
};

export const eliminarRolUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rol = await RolUsuario.findByPk(id);
    if (!rol) return res.status(404).json({ mensaje: 'Rol no encontrado' });
    await rol.destroy();
    res.json({ mensaje: 'Rol eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
