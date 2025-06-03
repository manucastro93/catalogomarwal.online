import { Categoria } from '@/categoria/categoria.model';
import Sequelize from 'sequelize';
import cache from '@/utils/cache';
import { crearAuditoria } from '@/utils/auditoria';

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
    reson({
      data: rows,
      pagina: Number(page),
      totalPaginas,
      totalItems: count,
      hasNextPage: Number(page) < totalPaginas,
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500)on({ message: 'Error al listar las categorías' });
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const { nombre, nombreWeb, orden, estado } = req.body;

    const categoriaExistenteActiva = await Categoria.findOne({
      where: { nombre, deletedAt: null },
    });

    if (categoriaExistenteActiva) {
      return res.status(400)on({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    const categoriaExistenteEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false,
    });

    if (categoriaExistenteEliminada) {
      categoriaExistenteEliminada.estado = estado;
      categoriaExistenteEliminada.orden = orden;
      categoriaExistenteEliminada.nombreWeb = nombreWeb;
      await categoriaExistenteEliminada.restore();
      cache.del('categoriasPublicas');
      return res.status(201)on({ message: 'Categoría restaurada correctamente', categoria: categoriaExistenteEliminada });
    }

    const nuevaCategoria = await Categoria.create({ nombre, nombreWeb, orden, estado });

    await crearAuditoria({
      tabla: 'categorias',
      accion: 'crea categoria',
      registroId: nuevaCategoria.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó la categoría ${nuevaCategoria.nombre}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.del('categoriasPublicas');
    return res.status(201)on({ message: 'Categoría creada correctamente', categoria: nuevaCategoria });
  } catch (error) {
    console.error(error);
    res.status(500)on({ message: 'Error al crear la categoría' });
  }
};

export const editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nombreWeb, orden, estado } = req.body;

    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res.status(404)on({ message: 'Categoría no encontrada' });
    }

    const categoriaExistente = await Categoria.findOne({
      where: { nombre, deletedAt: null },
    });

    const datosAntes = categoria.toJSON();

    if (categoriaExistente && categoriaExistente.id !== categoria.id) {
      return res.status(400)on({ message: `La categoría '${nombre}' ya existe y está activa` });
    }

    const categoriaEliminada = await Categoria.findOne({
      where: { nombre },
      paranoid: false,
    });

    if (categoriaEliminada && categoriaEliminada.id !== categoria.id) {
      categoriaEliminada.estado = estado;
      categoriaEliminada.orden = orden;
      categoriaEliminada.nombreWeb = nombreWeb;
      await categoriaEliminada.restore();
      cache.del('categoriasPublicas');
      return res.status(201)on({ message: 'Categoría restaurada correctamente', categoria: categoriaEliminada });
    }

    categoria.nombre = nombre;
    categoria.nombreWeb = nombreWeb;
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
    reson({ message: 'Categoría actualizada correctamente', categoria });
  } catch (error) {
    console.error(error);
    res.status(500)on({ message: 'Error al actualizar la categoría' });
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404)on({ message: 'Categoría no encontrada' });
    }

    await categoria.destroy();

    await crearAuditoria({
      tabla: 'categorias',
      accion: 'elimina categoria',
      registroId: categoria.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se eliminó la categoria "${categoria.nombre}"`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.del('categoriasPublicas');

    reson({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500)on({ message: 'Error al eliminar la categoría' });
  }
};
