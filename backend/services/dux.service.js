import axios from 'axios';
import { Categoria, Producto } from '../models/index.js';
import { estadoSync } from '../state/estadoSync.js';

const API_URL = process.env.DUX_API_URL_PRODUCTOS;
const API_KEY = process.env.DUX_API_KEY;
const NOMBRE_LISTA_GENERAL = process.env.DUX_LISTA_GENERAL;

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calcularStock(item) {
  if (!Array.isArray(item.stock)) return 0;
  return item.stock.reduce((acc, s) => acc + parseFloat(s.stock_disponible || '0'), 0);
}

function obtenerPrecioLista(listas, nombreBuscado) {
  if (!Array.isArray(listas)) return 0;
  const lista = listas.find(p => p.nombre?.toUpperCase().includes(nombreBuscado.toUpperCase()));
  return lista ? parseFloat(lista.precio || '0') : 0;
}

function limpiarNombreCategoria(nombre) {
  return typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Sin categoría';
}

export async function obtenerCategoriasDesdeDux(reintento = 0) {
  try {
    const res = await axios.get(`${API_URL}/rubros`, {
      headers: { Authorization: API_KEY, Accept: 'application/json' }
    });
    return res.data.results || [];
  } catch (error) {
    if (error.response?.status === 429 && reintento < 5) {
      const espera = 5000 * (reintento + 1);
      console.warn(`⏳ Esperando ${espera / 1000}s por 429... Reintento #${reintento + 1}`);
      await esperar(espera);
      return obtenerCategoriasDesdeDux(reintento + 1);
    }
    console.error('❌ Error al obtener rubros desde Dux:', error.response?.status, error.response?.data);
    throw error;
  }
}

export async function obtenerTodosLosItemsDesdeDux() {
  const todos = [];
  let offset = 0;
  const limit = 50;
  let pagina = 1;
  let total = 1;

  while (true) {
    console.log(`📦 Pidiendo página ${pagina} (offset ${offset})`);
    const lote = await intentarObtenerPagina(offset, limit, pagina);

    if (!lote?.items?.length) break;
    console.log(`🔍 Página ${pagina} → items: ${lote.items.length}, total: ${lote.total}`);

    if (pagina === 1 && lote.total) {
      total = lote.total;
    }

    todos.push(...lote.items);
    estadoSync.porcentaje = Math.floor((todos.length / total) * 100);

    offset += limit;
    pagina++;

    if (offset >= total) break;

    console.log('⏳ Esperando 5 segundos por rate-limit Dux...');
    await esperar(5000);
  }

  return todos;
}

async function intentarObtenerPagina(offset, limit, pagina, reintento = 0) {
  try {
    const res = await axios.get(`${API_URL}/items`, {
      headers: { Authorization: API_KEY, Accept: 'application/json' },
      params: { offset, limit }
    });

    return {
      items: res.data.results,
      total: res.data.paging?.total || 0
    };
  } catch (error) {
    if (error.response?.status === 429 && reintento < 5) {
      const espera = 5000 * (reintento + 1);
      console.warn(`⚠️ 429 en página ${pagina}. Esperando ${espera / 1000}s... Reintento #${reintento + 1}`);
      await esperar(espera);
      return intentarObtenerPagina(offset, limit, pagina, reintento + 1);
    }

    console.error(`❌ Error al obtener página ${pagina}:`, error.message);
    throw error;
  }
}

export async function sincronizarProductosDesdeDux() {
  estadoSync.porcentaje = 0;

  // Paso 1: sincronizar categorías
  await esperar(5000);
  const rubros = await obtenerCategoriasDesdeDux();
  const categoriasCreadas = new Set();

  for (const rubro of rubros) {
    const nombre = limpiarNombreCategoria(rubro.nombre);

    const existente = await Categoria.findOne({ where: { nombre } });

    if (!existente) {
      const nueva = await Categoria.create({
        nombre,
        nombreWeb: nombre,
        orden: 0,
        estado: true
      });
      categoriasCreadas.add(nueva.id);
    }
  }

  // Cargar todas las categorías en memoria para lookup rápido
  const todasCategorias = await Categoria.findAll();
  const categoriasMap = {};
  for (const cat of todasCategorias) {
    categoriasMap[limpiarNombreCategoria(cat.nombre)] = cat.id;
  }

  // Paso 2: sincronizar productos
  const items = await obtenerTodosLosItemsDesdeDux();

  let creados = 0;
  let actualizados = 0;

  for (const item of items) {
    try {
      let categoriaId = null;
      const productoExistente = await Producto.findOne({
        where: { sku: item.cod_item }
      });

      if (productoExistente?.categoriaId) {
        categoriaId = productoExistente.categoriaId;
      } else {
        const nombreCategoria = limpiarNombreCategoria(item.rubro?.nombre || '');
        categoriaId = categoriasMap[nombreCategoria] || null;
      }


      let precio = obtenerPrecioLista(item.precios, NOMBRE_LISTA_GENERAL);
      if (!precio || precio === 0) {
        precio = obtenerPrecioLista(item.precios, 'RETAIL');
      }
      precio = Math.round(precio / 1.21);

      const data = {
        nombre: item.item,
        sku: item.cod_item,
        precioUnitario: precio,
        costoDux: parseFloat(item.costo || '0'),
        stock: calcularStock(item),
        categoriaId,
        activo: true
      };

      if (productoExistente) {
        await productoExistente.update(data);
        actualizados++;
      } else {
        await Producto.create(data);
        creados++;
      }

    } catch (error) {
      console.error(`❌ Error procesando item ${item.cod_item}:`, error);
    }
  }

  console.log('\n🎉 Sincronización finalizada.');
  setTimeout(() => {
    estadoSync.porcentaje = 0;
  }, 3000);

  return {
    mensaje: `Se sincronizaron ${items.length} productos desde Dux.`,
    creados,
    actualizados,
    categoriasNuevas: categoriasCreadas.size
  };
}
