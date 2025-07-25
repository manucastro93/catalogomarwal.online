import { ComposicionProductoMateriaPrima, MateriaPrima, Producto, Proveedor } from '../models/index.js';
import { utilObtenerConfiguracionPorClave } from "../utils/configuracion.utils.js";

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
    const { composicion, tiempoProduccionSegundos, incluirTiempoEnCosto } = req.body;
    const tiempoProduccion = parseInt(tiempoProduccionSegundos || 0, 10);


    // Elimina la composición anterio
    await ComposicionProductoMateriaPrima.destroy({ where: { productoId } });

    // Crear nuevas composiciones
    await Promise.all(
      composicion.map((c) =>
        ComposicionProductoMateriaPrima.create({
          productoId,
          materiaPrimaId: c.materiaPrimaId,
          cantidad: c.cantidad,
          unidad: c.unidadMedida || null,
        })
      )
    );

    // Obtener las materias primas con su costo
    const composicionesConMateriaPrima = await ComposicionProductoMateriaPrima.findAll({
      where: { productoId },
      include: [{ model: MateriaPrima, as: "MateriaPrima" }],
    });

    // Calcular el total del costo
    const subtotal = composicionesConMateriaPrima.reduce((acc, item) => {
      const costo = item.MateriaPrima?.costoDux || 0;
      return acc + costo * item.cantidad;
    }, 0);

    const merma = await utilObtenerConfiguracionPorClave("merma_global");
    const valorHora = await utilObtenerConfiguracionPorClave("valor_hora");

    const porcentajeMerma = Number(merma?.valor || 0);
    const valorHoraNumero = Number(valorHora?.valor || 0);
    const valorPorSegundo = valorHoraNumero / 3600;
    let costoTiempo = 0;
    if(incluirTiempoEnCosto)
      costoTiempo = tiempoProduccion * valorPorSegundo;
    const base = subtotal + costoTiempo;
    const costoMerma = base * (porcentajeMerma / 100);

    const costoSistema = base + costoMerma;

    // Actualizar el product
    await Producto.update(
      {
        costoSistema,
        tiempoProduccionSegundos: tiempoProduccion,
        incluirTiempoEnCosto: incluirTiempoEnCosto,
      },
      { where: { id: productoId } }
    );

    res.json(composicionesConMateriaPrima);
  } catch (error) {
    next(error);
  }
};
