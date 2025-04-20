import { Producto } from '../models/index.js';

export const validarPedido = async (carritoCliente) => {
  const errores = [];

  for (const item of carritoCliente) {
    const productoBD = await Producto.findByPk(item.id);

    if (!productoBD) {
      errores.push({
        id: item.id,
        motivo: 'El producto ya no existe.',
      });
      continue;
    }

    if (!productoBD.activo) {
      errores.push({
        id: item.id,
        motivo: 'El producto fue desactivado.',
      });
      continue;
    }

    const mismoPrecio =
      Number(productoBD.precioPorBulto) === Number(item.precio);

    if (!mismoPrecio) {
      errores.push({
        id: item.id,
        motivo: 'El precio fue modificado.',
        precioActual: productoBD.precioPorBulto,
        precioCliente: item.precio,
      });
    }

    if (!productoBD.hayStock) {
      errores.push({
        id: item.id,
        motivo: 'El producto está sin stock.',
      });
    }
  }

  return errores;
};
