import { ConfiguracionSistema, Producto, MateriaPrima } from '../models/index.js';
import { Op } from "sequelize";

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
    if (configuracion.clave === "valor_hora" || configuracion.clave === "merma_global") {
      // 🔁 Traer todos los productos que tengan tiempoProduccionSegundos definido
      const productos = await Producto.findAll({
        where: {
          tiempoProduccionSegundos: { [Op.gt]: 0 }
        }
      });

      for (const producto of productos) {
        const composiciones = await ComposicionProductoMateriaPrima.findAll({
          where: { productoId: producto.id },
          include: [{ model: MateriaPrima, as: "MateriaPrima" }],
        });

        if (!composiciones.length) continue;

        const subtotal = composiciones.reduce((acc, item) => {
          const costo = item.MateriaPrima?.costoDux || 0;
          return acc + costo * item.cantidad;
        }, 0);

        // 🔄 Volver a obtener los valores actualizados
        const merma = await obtenerConfiguracionPorClave("merma_global");
        const valorHora = await obtenerConfiguracionPorClave("valor_hora");

        const porcentajeMerma = Number(merma?.valor || 0);
        const valorHoraNumero = Number(valorHora?.valor || 0);
        const valorPorSegundo = valorHoraNumero / 3600;

        const costoMerma = (subtotal + producto.tiempoProduccionSegundos * valorPorSegundo) * (porcentajeMerma / 100);
        const costoTiempo = producto.tiempoProduccionSegundos * valorPorSegundo;

        const costoSistema = subtotal + costoTiempo + costoMerma;

        await producto.update({ costoSistema });
      }
    }

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
