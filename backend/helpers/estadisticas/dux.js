// helpers/estadisticas/dux.js
import { QueryTypes } from 'sequelize';
// AJUSTAR ruta a sequelize:
import { sequelize } from '../../models/index.js';
import { COLLATE, TOTAL_DUX_EXPR } from './common.js';

function baseFromJoin() {
  return `
    FROM PedidosDux p
    LEFT JOIN (
      SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
      FROM Facturas f
      GROUP BY f.nro_pedido
    ) fx ON fx.nro_pedido = p.nro_pedido
    LEFT JOIN ClientesDux c ON c.cliente = p.cliente
    WHERE p.fecha BETWEEN :inicioMes AND :finMes
      AND (:idVendedor IS NULL OR COALESCE(fx.id_vendedor, c.vendedorId) = :idVendedor)
  `;
}

function subVendedor() {
  return `
    SELECT
      p2.id,
      COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId
    FROM PedidosDux p2
    LEFT JOIN (
      SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
      FROM Facturas f
      WHERE (f.anulada_boolean IS NULL OR f.anulada_boolean = 0)
      GROUP BY f.nro_pedido
    ) fx ON fx.nro_pedido = p2.nro_pedido
    LEFT JOIN ClientesDux c ON c.cliente = p2.cliente
  `;
}

export async function getDuxKpis({ inicioMes, finMes, idVendedor }) {
  const _base = baseFromJoin();
  const _subV = subVendedor();
  const replacements = { inicioMes, finMes, idVendedor };

  // Totales
  const duxAgg = await sequelize.query(
    `SELECT COUNT(*) AS cantidad, COALESCE(SUM(${TOTAL_DUX_EXPR}), 0) AS total ${_base}`,
    { type: QueryTypes.SELECT, replacements }
  );
  const totalPedidosDux   = Number(duxAgg[0]?.cantidad ?? 0);
  const totalFacturadoDux = Number(duxAgg[0]?.total ?? 0);

  // ---------- Vendedores TOP 5 por cantidad
// ---------- Vendedores TOP 5 por cantidad
const vendedoresTopCantDux = await sequelize.query(
  `
  SELECT
    t.vendedorId,
    TRIM(CONCAT_WS(', ',
      NULLIF(TRIM(pd.apellido_razon_social), ''),
      NULLIF(TRIM(pd.nombre), '')
    )) AS nombre,
    COUNT(*) AS totalPedidos,
    COALESCE(SUM(t.total_num), 0) AS totalFacturado
  FROM (
    SELECT
      COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId,
      CAST(REPLACE(REPLACE(REPLACE(REPLACE(p.total, 'AR$', ''), '$', ''), '.', ''), ',', '.') AS DECIMAL(18,2)) AS total_num
    ${_base}
  ) t
  LEFT JOIN PersonalDux pd
    ON CAST(pd.id_personal AS CHAR) = CAST(t.vendedorId AS CHAR)
    -- si en tu base hay ceros a la izquierda, descomentá esta línea extra:
    -- OR pd.id_personal = LPAD(CAST(t.vendedorId AS CHAR), 8, '0')
  GROUP BY t.vendedorId, pd.apellido_razon_social, pd.nombre
  ORDER BY totalPedidos DESC
  LIMIT 5
  `,
  { type: QueryTypes.SELECT, replacements }
);

// ---------- Vendedores TOP 5 por facturación
const vendedoresTopMontoDux = await sequelize.query(
  `
  SELECT
    t.vendedorId,
    TRIM(CONCAT_WS(', ',
      NULLIF(TRIM(pd.apellido_razon_social), ''),
      NULLIF(TRIM(pd.nombre), '')
    )) AS nombre,
    COUNT(*) AS totalPedidos,
    COALESCE(SUM(t.total_num), 0) AS totalFacturado
  FROM (
    SELECT
      COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId,
      CAST(REPLACE(REPLACE(REPLACE(REPLACE(p.total, 'AR$', ''), '$', ''), '.', ''), ',', '.') AS DECIMAL(18,2)) AS total_num
    ${_base}
  ) t
  LEFT JOIN PersonalDux pd
    ON CAST(pd.id_personal AS CHAR) = CAST(t.vendedorId AS CHAR)
    -- OR pd.id_personal = LPAD(CAST(t.vendedorId AS CHAR), 8, '0')
  GROUP BY t.vendedorId, pd.apellido_razon_social, pd.nombre
  ORDER BY totalFacturado DESC
  LIMIT 5
  `,
  { type: QueryTypes.SELECT, replacements }
);

// mapping: NO pongas '—' acá; dejá null si no hay nombre
const mapVend = rows => rows.map(r => ({
  usuarioId: null,
  totalPedidos: Number(r.totalPedidos || 0),
  totalFacturado: Number(r.totalFacturado || 0),
  usuario: { nombre: r.nombre && r.nombre.trim() ? r.nombre : null },
  vendedorId: r.vendedorId ?? null,
}));


  // ---------- Productos TOP 5 por cantidad
  const productosTopCantDux = await sequelize.query(
    `
    SELECT
      d.codItem AS codItem,
      COALESCE(prod.id, 0) AS productoId,
      ANY_VALUE(COALESCE(
        prod.nombre COLLATE ${COLLATE},
        d.descripcion COLLATE ${COLLATE}
      )) AS nombre,
      SUM(d.cantidad) AS cantidadVendida,
      SUM(d.subtotal) AS totalFacturado,
      (
        SELECT ip.url
        FROM ImagenProductos ip
        WHERE ip.productoId = prod.id
        ORDER BY ip.id
        LIMIT 1
      ) AS imagenUrl
    FROM DetallePedidosDux d
    JOIN PedidosDux p            ON p.id = d.pedidoDuxId
    LEFT JOIN (${_subV}) t       ON t.id = p.id
    LEFT JOIN Productos prod     ON LOWER(TRIM(prod.sku)) COLLATE ${COLLATE} =
                                   LOWER(TRIM(d.codItem)) COLLATE ${COLLATE}
    WHERE p.fecha BETWEEN :inicioMes AND :finMes
      AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
    GROUP BY d.codItem, prod.id
    ORDER BY cantidadVendida DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  // ---------- Productos TOP 5 por facturación
  const productosTopMontoDux = await sequelize.query(
    `
    SELECT
      d.codItem AS codItem,
      COALESCE(prod.id, 0) AS productoId,
      ANY_VALUE(COALESCE(
        prod.nombre COLLATE ${COLLATE},
        d.descripcion COLLATE ${COLLATE}
      )) AS nombre,
      SUM(d.cantidad) AS cantidadVendida,
      SUM(d.subtotal) AS totalFacturado,
      (
        SELECT ip.url
        FROM ImagenProductos ip
        WHERE ip.productoId = prod.id
        ORDER BY ip.id
        LIMIT 1
      ) AS imagenUrl
    FROM DetallePedidosDux d
    JOIN PedidosDux p            ON p.id = d.pedidoDuxId
    LEFT JOIN (${_subV}) t       ON t.id = p.id
    LEFT JOIN Productos prod     ON LOWER(TRIM(prod.sku)) COLLATE ${COLLATE} =
                                   LOWER(TRIM(d.codItem)) COLLATE ${COLLATE}
    WHERE p.fecha BETWEEN :inicioMes AND :finMes
      AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
    GROUP BY d.codItem, prod.id
    ORDER BY totalFacturado DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  const mapProds = rows => rows.map(r => ({
    productoId: Number(r.productoId || 0),
    cantidadVendida: Number(r.cantidadVendida || 0),
    totalFacturado: Number(r.totalFacturado || 0),
    Producto: { nombre: r.nombre || null, imagenUrl: r.imagenUrl || null },
  }));

  // ---------- Categorías TOP 5 por cantidad
  const categoriasTopCantDux = await sequelize.query(
    `
    SELECT
      cat.id AS categoriaId,
      cat.nombre AS nombre,
      SUM(d.cantidad) AS totalVendidas,
      SUM(d.subtotal) AS totalFacturado
    FROM DetallePedidosDux d
    JOIN PedidosDux p            ON p.id = d.pedidoDuxId
    LEFT JOIN (${_subV}) t       ON t.id = p.id
    JOIN Productos prod          ON LOWER(TRIM(prod.sku)) COLLATE ${COLLATE} =
                                   LOWER(TRIM(d.codItem)) COLLATE ${COLLATE}
    JOIN Categorias cat          ON cat.id = prod.categoriaId
    WHERE p.fecha BETWEEN :inicioMes AND :finMes
      AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
    GROUP BY cat.id, cat.nombre
    ORDER BY totalVendidas DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  // ---------- Categorías TOP 5 por facturación
  const categoriasTopMontoDux = await sequelize.query(
    `
    SELECT
      cat.id AS categoriaId,
      cat.nombre AS nombre,
      SUM(d.cantidad) AS totalVendidas,
      SUM(d.subtotal) AS totalFacturado
    FROM DetallePedidosDux d
    JOIN PedidosDux p            ON p.id = d.pedidoDuxId
    LEFT JOIN (${_subV}) t       ON t.id = p.id
    JOIN Productos prod          ON LOWER(TRIM(prod.sku)) COLLATE ${COLLATE} =
                                   LOWER(TRIM(d.codItem)) COLLATE ${COLLATE}
    JOIN Categorias cat          ON cat.id = prod.categoriaId
    WHERE p.fecha BETWEEN :inicioMes AND :finMes
      AND (:idVendedor IS NULL OR t.vendedorId = :idVendedor)
    GROUP BY cat.id, cat.nombre
    ORDER BY totalFacturado DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  // ---------- Clientes TOP 5 por facturación y por cantidad
  const clientesTopMontoDux = await sequelize.query(
    `
    SELECT
      p.cliente AS nombre,
      COUNT(*) AS cantidadPedidos,
      COALESCE(SUM(${TOTAL_DUX_EXPR}), 0) AS totalGastado
    ${_base}
    GROUP BY p.cliente
    ORDER BY totalGastado DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  const clientesTopCantDux = await sequelize.query(
    `
    SELECT
      p.cliente AS nombre,
      COUNT(*) AS cantidadPedidos,
      COALESCE(SUM(${TOTAL_DUX_EXPR}), 0) AS totalGastado
    ${_base}
    GROUP BY p.cliente
    ORDER BY cantidadPedidos DESC
    LIMIT 5
    `,
    { type: QueryTypes.SELECT, replacements }
  );

  const mapClientes = rows => rows.map(r => ({
    clienteId: 0,
    totalGastado: Number(r.totalGastado || 0),
    cantidadPedidos: Number(r.cantidadPedidos || 0),
    cliente: { nombre: r.nombre ?? '—' },
  }));

  // Para tarjetas “estrella” (top 1) rápido
  const vendedorTopDuxNorm =
    vendedoresTopCantDux.length
      ? {
          usuarioId: null,
          cantidad: Number(vendedoresTopCantDux[0].totalPedidos || 0),
          totalFacturado: Number(vendedoresTopCantDux[0].totalFacturado || 0),
          usuario: { nombre: vendedoresTopCantDux[0].nombre || '—' },
        }
      : null;

  const productoEstrellaDux =
    productosTopCantDux.length
      ? {
          productoId: productosTopCantDux[0].productoId,
          totalVendidas: productosTopCantDux[0].cantidadVendida,
          totalFacturado: productosTopCantDux[0].totalFacturado,
          Producto: productosTopCantDux[0].Producto,
        }
      : null;

  const categoriaTopDux =
    categoriasTopMontoDux.length ? { nombre: categoriasTopMontoDux[0].nombre } : null;

  return {
    totalPedidosDux,
    totalFacturadoDux,

    // Cards (top 1)
    vendedorTopDuxNorm,
    productoEstrellaDux,
    categoriaTopDux,

    // Rankings TOP 5
    vendedoresTopCantDux: mapVend(vendedoresTopCantDux),
    vendedoresTopMontoDux: mapVend(vendedoresTopMontoDux),
    productosTopCantDux: mapProds(productosTopCantDux),
    productosTopMontoDux: mapProds(productosTopMontoDux),
    categoriasTopCantDux: categoriasTopCantDux.map(r => ({
      categoriaId: r.categoriaId,
      nombre: r.nombre,
      totalVendidas: Number(r.totalVendidas || 0),
      totalFacturado: Number(r.totalFacturado || 0),
    })),
    categoriasTopMontoDux: categoriasTopMontoDux.map(r => ({
      categoriaId: r.categoriaId,
      nombre: r.nombre,
      totalVendidas: Number(r.totalVendidas || 0),
      totalFacturado: Number(r.totalFacturado || 0),
    })),
    clientesTopMontoDux: mapClientes(clientesTopMontoDux),
    clientesTopCantDux: mapClientes(clientesTopCantDux),
  };
}
