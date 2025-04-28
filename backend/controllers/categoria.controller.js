import { Categoria } from '../models/index.js';
import Sequelize from 'sequelize';
import cache from '../utils/cache.js';
import { crearAuditoria } from '../utils/auditoria.js';

export const listarCategorias = async (req, res) => {
  try {
    const { page = 1, limit = 10, buscar = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (buscar) {
      where.nombre = { [Sequelize.Op.like]: `%${buscar}%` };
    }

    const { count, rows } = await Categoria.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['orden', 'ASC']],
    });

    const totalPaginas = Math.ceil(count / limit);

    res.json({
      data: rows,
      pagina: Number(page),
      totalPaginas,
      totalItems: count,
      hasNextPage: Number(page) < totalPaginas,
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al listar las categorías' });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, orden, estado } = req.body;

    const categoriaExistenteActiva = await Categoria.findOne({
      where: { nombre, deletedAt: null },
    });

    if (categoriaExistenteActiva) {
      return res.status(400).json({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    const categoriaExistenteEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false,
    });

    if (categoriaExistenteEliminada) {
      categoriaExistenteEliminada.estado = estado;
      categoriaExistenteEliminada.orden = orden;
      await categoriaExistenteEliminada.restore();
      cache.del('categoriasPublicas');
      return res.status(201).json({ message: 'Categoría restaurada correctamente', categoria: categoriaExistenteEliminada });
    }

    const nuevaCategoria = await Categoria.create({ nombre, orden, estado });

    await crearAuditoria({
      tabla: 'categorias',
      accion: 'crea categoria',
      registroId: categoria.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó la categoría ${categoria.nombre}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.del('categoriasPublicas');
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

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const categoriaExistente = await Categoria.findOne({
      where: { nombre, deletedAt: null },
    });

    const datosAntes = categoriaExistente.toJSON();

    if (categoriaExistente && categoriaExistente.id !== categoria.id) {
      return res.status(400).json({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    const categoriaEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false,
    });

    if (categoriaEliminada && categoriaEliminada.id !== categoria.id) {
      categoriaEliminada.estado = estado;
      categoriaEliminada.orden = orden;
      await categoriaEliminada.restore();
      cache.del('categoriasPublicas');
      return res.status(201).json({ message: 'Categoría restaurada correctamente', categoria: categoriaEliminada });
    }

    categoria.nombre = nombre;
    categoria.orden = orden;
    categoria.estado = estado;
    await categoria.save();
    
    const datosDespues = categoria.toJSON();

    await crearAuditoria({
      tabla: 'categorias',
      accion: 'actualiza categoria',
      registroId: categoria.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Categoria ${categoria.nombre} actualizada.`,
      datosAntes,
      datosDespues,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    cache.del('categoriasPublicas');
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

     await crearAuditoria({
      tabla: 'categorias',
      accion: 'elimina categoria',
      registroId: categoria.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se eliminó la categoria "${categoria.nombre}"`,
      ip,
    });
    
    cache.del('categoriasPublicas');

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la categoría' });
  }
};
