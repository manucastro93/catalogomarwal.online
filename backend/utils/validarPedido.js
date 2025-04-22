import { Producto, ImagenProducto } from "../models/index.js";

export const verificarProductosDelCarrito = async (carritoCliente) => {
  const errores = [];
  const productosActualizados = [];

  for (const item of carritoCliente) {
    const productoBD = await Producto.findByPk(item.id, {
      include: [
        {
          model: ImagenProducto,
          as: "Imagenes",
          attributes: ["url", "orden"],
          required: false,
        },
      ],
    });

    if (!productoBD) {
      errores.push({
        id: item.id,
        nombre: item.nombre || "Producto",
        motivo: `${item.nombre || "El producto"} ya no existe.`,
      });
      continue;
    }

    if (!productoBD.activo) {
      errores.push({
        id: item.id,
        nombre: productoBD.nombre,
        motivo: `${productoBD.nombre} fue desactivado.`,
      });
      continue;
    }

    const mismoPrecio =
      Number(productoBD.precioPorBulto) === Number(item.precio);
    if (!mismoPrecio) {
      errores.push({
        id: item.id,
        nombre: productoBD.nombre,
        motivo: ` fue modificado.`,
        precioActual: productoBD.precioPorBulto,
        precioCliente: item.precio,
      });
    }

    // Agregar versión actualizada del producto
    const imagenUrl = productoBD.Imagenes?.[0]?.url || null;

    productosActualizados.push({
      id: productoBD.id,
      nombre: productoBD.nombre,
      precio: productoBD.precioPorBulto,
      unidadPorBulto: productoBD.unidadPorBulto,
      imagen: imagenUrl,
    });
  }

  return { errores, carritoActualizado: productosActualizados };
};
