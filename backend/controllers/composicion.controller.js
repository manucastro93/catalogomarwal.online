import { ComposicionProductoMateriaPrima, MateriaPrima, Producto, Proveedor } from '../models/index.js';

// Listar todas las composiciones de un producto
export const listarComposicionesPorProducto = async (req, res, next) => {
  try {
    const { productoId } = req.params;

    const composiciones = await ComposicionProductoMateriaPrima.findAll({
      where: { productoId },
      include: [
        {
          model: MateriaPrima,
          as: 'MateriaPrima',
          include: [
            {
              model: Proveedor,
              as: 'Proveedor',
            },
          ],
        },
      ],
    });

    res.json(composiciones);
  } catch (error) {
    next(error);
  }
};


// Agregar una composición a un producto
export const agregarComposicion = async (req, res, next) => {
  try {
    const { productoId, materiaPrimaId, cantidad, unidad, detalle } = req.body;
    const composicion = await ComposicionProductoMateriaPrima.create({
      productoId,
      materiaPrimaId,
      cantidad,
      unidad,
      detalle
    });
    res.status(201).json(composicion);
  } catch (error) {
    next(error);
  }
};

// Editar una composición
export const editarComposicion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const composicion = await ComposicionProductoMateriaPrima.findByPk(id);
    if (!composicion) return res.status(404).json({ mensaje: 'Composición no encontrada' });

    await composicion.update(req.body);
    res.json(composicion);
  } catch (error) {
    next(error);
  }
};

// Eliminar una composición
export const eliminarComposicion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const composicion = await ComposicionProductoMateriaPrima.findByPk(id);
    if (!composicion) return res.status(404).json({ mensaje: 'Composición no encontrada' });

    await composicion.destroy();
    res.json({ mensaje: 'Composición eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

export const guardarComposicion = async (req, res, next) => {
  try {
    const productoId = parseInt(req.params.id, 10);
    const { composicion } = req.body; // [{ materiaPrimaId, cantidad }]

    // Elimina la composición anterior (soft delete si tenés paranoid, o destroy físico)
    await ComposicionProductoMateriaPrima.destroy({ where: { productoId } });

    // Crea la nueva composición
    await Promise.all(
      composicion.map(async (c) => 
        ComposicionProductoMateriaPrima.create({ 
          productoId, 
          materiaPrimaId: c.materiaPrimaId, 
          cantidad: c.cantidad,
          unidad: c.unidadMedida || null
        })
      )
    );

    // Opcional: incluir info de la materia prima
    const resultado = await ComposicionProductoMateriaPrima.findAll({
      where: { productoId },
      include: [{ model: MateriaPrima, as: 'MateriaPrima' }]
    });

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};