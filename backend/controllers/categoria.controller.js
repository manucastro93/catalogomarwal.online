import { Categoria } from '../models/index.js';
import Sequelize from 'sequelize';

export const listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al listar las categorías' });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, orden, estado } = req.body;

    // Verificar si ya existe una categoría activa con el mismo nombre
    const categoriaExistenteActiva = await Categoria.findOne({
      where: { nombre, deletedAt: null }, // Buscar solo categorías activas
    });

    if (categoriaExistenteActiva) {
      return res.status(400).json({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    // Verificar si ya existe una categoría eliminada con el mismo nombre
    const categoriaExistenteEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false, // Incluye los registros eliminados
    });

    if (categoriaExistenteEliminada) {
      // Si la categoría está eliminada, restaurarla
      categoriaExistenteEliminada.estado = estado;
      categoriaExistenteEliminada.orden = orden;
      await categoriaExistenteEliminada.restore(); // Restaurar la categoría eliminada
      return res.status(201).json({ message: 'Categoría restaurada correctamente', categoria: categoriaExistenteEliminada });
    }

    // Si no existe, crear una nueva categoría
    const nuevaCategoria = await Categoria.create({
      nombre,
      orden,
      estado,
    });

    return res.status(201).json({ message: 'Categoría creada correctamente', categoria: nuevaCategoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la categoría' });
  }
};


export const editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, orden, estado } = req.body;

    // Buscar la categoría a editar
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    // Verificar si existe una categoría activa con el mismo nombre
    const categoriaExistente = await Categoria.findOne({
      where: { nombre, deletedAt: null },
    });

    if (categoriaExistente && categoriaExistente.id !== categoria.id) {
      return res.status(400).json({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    // Verificar si la categoría está eliminada y con el mismo nombre
    const categoriaEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false,
    });

    if (categoriaEliminada && categoriaEliminada.id !== categoria.id) {
      // Si la categoría está eliminada, restaurarla
      categoriaEliminada.estado = estado;
      categoriaEliminada.orden = orden;
      await categoriaEliminada.restore(); // Restaurar la categoría eliminada
      return res.status(201).json({ message: 'Categoría restaurada correctamente', categoria: categoriaEliminada });
    }

    // Actualizar la categoría
    categoria.nombre = nombre;
    categoria.orden = orden;
    categoria.estado = estado;

    await categoria.save();

    res.json({ message: 'Categoría actualizada correctamente', categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la categoría' });
  }
};


export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    await categoria.destroy();
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la categoría' });
  }
};
