// helpers/estadisticas/local.js
import { Op, fn, col, literal } from 'sequelize';
// AJUSTAR rutas:
import {
  Pedido,
  DetallePedido,
  Producto,
  ImagenProducto,
  Usuario,
  Cliente,
  Categoria,
} from '../../models/index.js';
import { ROLES_USUARIOS } from '../../constants/rolesUsuarios.js';

function buildWherePedidos({ inicioMes, finMes, req }) {
  const where = { createdAt: { [Op.between]: [inicioMes, finMes] } };
  if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
    where.usuarioId = req.usuario.id;
  }
  return where;
}

export async function getLocalKpis({ inicioMes, finMes, req }) {
  const wherePedidos = buildWherePedidos({ inicioMes, finMes, req });

  const [totalPedidosLocal, totalFacturadoLocal] = await Promise.all([
    Pedido.count({ where: wherePedidos }),
    Pedido.sum('total', { where: wherePedidos }),
  ]);

  // ---------- Productos TOP 5 por cantidad
  const productosTopCantLocalRows = await DetallePedido.findAll({
    attributes: [
      'productoId',
      [fn('SUM', col('cantidad')), 'cantidadVendida'],
      [fn('SUM', col('subtotal')), 'totalFacturado'],
    ],
    include: [{ model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] }],
    group: ['productoId'],
    order: [[literal('cantidadVendida'), 'DESC']],
    limit: 5,
    raw: true,
  });

  // ---------- Productos TOP 5 por facturación
  const productosTopMontoLocalRows = await DetallePedido.findAll({
    attributes: [
      'productoId',
      [fn('SUM', col('cantidad')), 'cantidadVendida'],
      [fn('SUM', col('subtotal')), 'totalFacturado'],
    ],
    include: [{ model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] }],
    group: ['productoId'],
    order: [[literal('totalFacturado'), 'DESC']],
    limit: 5,
    raw: true,
  });

  // Enriquecemos con nombre/imagen
  async function hydrateProductos(rows) {
    const ids = rows.map(r => r.productoId).filter(Boolean);
    const productos = await Producto.findAll({
      where: { id: ids },
      attributes: ['id', 'nombre'],
      include: [{ model: ImagenProducto, as: 'Imagenes', attributes: ['url'], required: false }],
      paranoid: false,
    });
    const map = new Map(productos.map(p => [p.id, {
      nombre: p.nombre,
      imagenUrl: Array.isArray(p.Imagenes) ? p.Imagenes[0]?.url ?? null : null,
    }]));
    return rows.map(r => ({
      productoId: r.productoId,
      cantidadVendida: Number(r.cantidadVendida || 0),
      totalFacturado: Number(r.totalFacturado || 0),
      Producto: map.get(r.productoId) ?? { nombre: null, imagenUrl: null },
    }));
  }

  const [productosTopCantLocal, productosTopMontoLocal] = await Promise.all([
    hydrateProductos(productosTopCantLocalRows),
    hydrateProductos(productosTopMontoLocalRows),
  ]);

  // ---------- Vendedores TOP 5 por cantidad de pedidos
  const vendedoresTopCantLocal = await Pedido.findAll({
    attributes: [
      'usuarioId',
      [fn('COUNT', col('Pedido.id')), 'totalPedidos'],
      [fn('SUM', col('Pedido.total')), 'totalFacturado'],
    ],
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
    where: wherePedidos,
    group: ['usuarioId', 'usuario.id', 'usuario.nombre'],
    order: [[literal('totalPedidos'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  // ---------- Vendedores TOP 5 por facturación
  const vendedoresTopMontoLocal = await Pedido.findAll({
    attributes: [
      'usuarioId',
      [fn('COUNT', col('Pedido.id')), 'totalPedidos'],
      [fn('SUM', col('Pedido.total')), 'totalFacturado'],
    ],
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
    where: wherePedidos,
    group: ['usuarioId', 'usuario.id', 'usuario.nombre'],
    order: [[literal('totalFacturado'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  const mapVend = (rows) =>
    rows.map(r => ({
      usuarioId: r.usuarioId ?? null,
      totalPedidos: Number(r.totalPedidos || 0),
      totalFacturado: Number(r.totalFacturado || 0),
      usuario: { nombre: r.usuario?.nombre ?? '—' },
    }));

  // ---------- Categorías TOP 5 por cantidad y por facturación
  const categoriasTopCantLocalRows = await DetallePedido.findAll({
    attributes: [
      [col('producto.categoriaId'), 'categoriaId'],
      [fn('SUM', col('cantidad')), 'totalVendidas'],
      [fn('SUM', col('subtotal')), 'totalFacturado'],
    ],
    include: [
      {
        model: Producto,
        as: 'producto',
        attributes: [],
        include: [{ model: Categoria, as: 'Categoria', attributes: ['id', 'nombre'], required: true }],
        required: true,
      },
      { model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] },
    ],
    group: ['producto.categoriaId', 'producto.Categoria.id', 'producto.Categoria.nombre'],
    order: [[literal('totalVendidas'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  const categoriasTopMontoLocalRows = await DetallePedido.findAll({
    attributes: [
      [col('producto.categoriaId'), 'categoriaId'],
      [fn('SUM', col('cantidad')), 'totalVendidas'],
      [fn('SUM', col('subtotal')), 'totalFacturado'],
    ],
    include: [
      {
        model: Producto,
        as: 'producto',
        attributes: [],
        include: [{ model: Categoria, as: 'Categoria', attributes: ['id', 'nombre'], required: true }],
        required: true,
      },
      { model: Pedido, as: 'pedido', where: wherePedidos, attributes: [] },
    ],
    group: ['producto.categoriaId', 'producto.Categoria.id', 'producto.Categoria.nombre'],
    order: [[literal('totalFacturado'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  const mapCats = rows => rows.map(r => ({
    categoriaId: r.categoriaId,
    nombre: r.producto?.Categoria?.nombre ?? '—',
    totalVendidas: Number(r.totalVendidas || 0),
    totalFacturado: Number(r.totalFacturado || 0),
  }));

  // ---------- Clientes TOP 5 por facturación (ya lo tenías)
  const clientesTopMontoLocalRows = await Pedido.findAll({
    attributes: [
      'clienteId',
      [fn('SUM', col('total')), 'totalGastado'],
      [fn('COUNT', col('Pedido.id')), 'cantidadPedidos'],
    ],
    include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
    where: wherePedidos,
    group: ['clienteId', 'cliente.id', 'cliente.nombre'],
    order: [[literal('totalGastado'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  // ---------- Clientes TOP 5 por cantidad
  const clientesTopCantLocalRows = await Pedido.findAll({
    attributes: [
      'clienteId',
      [fn('SUM', col('total')), 'totalGastado'],
      [fn('COUNT', col('Pedido.id')), 'cantidadPedidos'],
    ],
    include: [{ model: Cliente, as: 'cliente', attributes: ['nombre'] }],
    where: wherePedidos,
    group: ['clienteId', 'cliente.id', 'cliente.nombre'],
    order: [[literal('cantidadPedidos'), 'DESC']],
    limit: 5,
    raw: true,
    nest: true,
  });

  const mapClientes = rows => rows.map(r => ({
    clienteId: r.clienteId,
    totalGastado: Number(r.totalGastado || 0),
    cantidadPedidos: Number(r.cantidadPedidos || 0),
    cliente: { nombre: r.cliente?.nombre ?? '—' },
  }));

  // Para tarjetas “estrella” (top 1) rápido
  const productoEstrella =
    productosTopCantLocal[0]
      ? {
          productoId: productosTopCantLocal[0].productoId,
          totalVendidas: productosTopCantLocal[0].cantidadVendida,
          totalFacturado: productosTopCantLocal[0].totalFacturado,
          Producto: productosTopCantLocal[0].Producto,
        }
      : null;

  const vendedorTopLocalNorm =
    vendedoresTopCantLocal.length
      ? {
          usuarioId: vendedoresTopCantLocal[0].usuarioId,
          cantidad: vendedoresTopCantLocal[0].totalPedidos,
          totalFacturado: vendedoresTopCantLocal[0].totalFacturado,
          usuario: vendedoresTopCantLocal[0].usuario,
        }
      : null;

  const categoriaTopLocal =
    categoriasTopMontoLocalRows.length
      ? { nombre: categoriasTopMontoLocalRows[0].producto?.Categoria?.nombre ?? '—' }
      : null;

  return {
    totalPedidosLocal,
    totalFacturadoLocal,

    // Cards (top 1)
    productoEstrella,
    vendedorTopLocalNorm,
    categoriaTopLocal,

    // Rankings TOP 5
    productosTopCantLocal,
    productosTopMontoLocal,
    vendedoresTopCantLocal: mapVend(vendedoresTopCantLocal),
    vendedoresTopMontoLocal: mapVend(vendedoresTopMontoLocal),
    categoriasTopCantLocal: mapCats(categoriasTopCantLocalRows),
    categoriasTopMontoLocal: mapCats(categoriasTopMontoLocalRows),
    clientesTopMontoLocal: mapClientes(clientesTopMontoLocalRows),
    clientesTopCantLocal: mapClientes(clientesTopCantLocalRows),
  };
}
