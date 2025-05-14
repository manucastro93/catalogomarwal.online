import axios from 'axios';
import { Op } from 'sequelize';
import {
  Producto as ProductoModel,
  Marca,
  Categoria,
  ImagenProducto
} from '../models/index.js';

const DUX_EMAIL = process.env.DUX_EMAIL;
const DUX_PASSWORD = process.env.DUX_PASSWORD;
const LOGIN_URL = process.env.DUX_LOGIN_URL;
const PRODUCTOS_URL = process.env.DUX_PRODUCTOS_URL;

let tokenDux = null; // se guarda en memoria durante runtime

async function loginDux() {
  try {
    const res = await axios.post(LOGIN_URL, {
      email: DUX_EMAIL,
      password: DUX_PASSWORD,
    });

    tokenDux = res.data.token;
    return true;
  } catch (err) {
    console.error('[DUX] Error al hacer login:', err.message);
    return false;
  }
}

async function fetchProductosConToken() {
  if (!tokenDux) {
    const ok = await loginDux();
    if (!ok) throw new Error('No se pudo iniciar sesión en Dux');
  }

  try {
    const res = await axios.get(PRODUCTOS_URL, {
      headers: {
        Authorization: `Bearer ${tokenDux}`,
      },
    });
    return res.data;
  } catch (err) {
    // Si el token expiró, reintenta una vez
    if (err.response?.status === 401) {
      console.warn('[DUX] Token expirado, reintentando login...');
      const ok = await loginDux();
      if (!ok) throw new Error('Login fallido al renovar token');

      const res = await axios.get(PRODUCTOS_URL, {
        headers: { Authorization: `Bearer ${tokenDux}` },
      });
      return res.data;
    }
    throw err;
  }
}

export async function sincronizarProductosDesdeDux() {
  try {
    const productosDux = await fetchProductosConToken();
    const idsDux = new Set();

    for (const p of productosDux) {
      const {
        idProducto,
        descripcion,
        codigo,
        detalle,
        precio,
        stock,
        marca,
        rubro,
        precioPorBulto,
        unidadPorBulto,
        costo,
        imagenes,
      } = p;

      idsDux.add(idProducto);

      // Marca
      let marcaId = null;
      if (marca) {
        const [m] = await Marca.findOrCreate({ where: { nombre: marca } });
        marcaId = m.id;
      }

      // Categoría
      let categoriaId = null;
      if (rubro) {
        const [c] = await Categoria.findOrCreate({ where: { nombre: rubro } });
        categoriaId = c.id;
      }

      // Producto
      await ProductoModel.upsert({
        id: idProducto,
        nombre: descripcion || '',
        sku: codigo || '',
        descripcion: detalle || '',
        precioUnitario: precio || 0,
        precioPorBulto: precioPorBulto || null,
        unidadPorBulto: unidadPorBulto || null,
        stock: stock || 0,
        marcaId,
        categoriaId,
        costoDux: costo || 0,
        activo: 1,
      });

      // Imágenes
      await ImagenProducto.destroy({ where: { productoId: idProducto } });

      if (Array.isArray(imagenes)) {
        const imagenesInsertar = imagenes.map((url, i) => ({
          productoId: idProducto,
          url,
          orden: i + 1,
        }));
        await ImagenProducto.bulkCreate(imagenesInsertar);
      }
    }

    // Eliminar productos que ya no están en Dux
    const locales = await ProductoModel.findAll({ attributes: ['id'] });
    const idsLocales = locales.map(p => p.id);
    const idsAEliminar = idsLocales.filter(id => !idsDux.has(id));

    if (idsAEliminar.length) {
      await ProductoModel.destroy({ where: { id: { [Op.in]: idsAEliminar } } });
    }

    return { ok: true, mensaje: 'Sincronización completada con éxito' };
  } catch (error) {
    console.error('Error al sincronizar productos desde Dux:', error);
    return { ok: false, mensaje: 'Error en la sincronización', error };
  }
}
