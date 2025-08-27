import { Op, Sequelize } from 'sequelize';
import { Factura, DetalleFactura, ComprobantesServicios, CategoriasServicios, ProveedoresServicios } from '../models/index.js';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';

const monthKey = (i) => ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][i];
const emptyYear = () => ({ ene: 0, feb: 0, mar: 0, abr: 0, may: 0, jun: 0, jul: 0, ago: 0, sep: 0, oct: 0, nov: 0, dic: 0 });
const withMoM = (row) => {
    const k = Object.keys(row); const v = emptyYear();
    for (let i = 0; i < k.length; i++) {
        if (i === 0) v[k[i]] = 0;
        else { const a = row[k[i - 1]] || 0, b = row[k[i]] || 0; v[k[i]] = a === 0 ? 0 : ((b - a) / a) * 100; }
    }
    return { valores: row, variacion: v };
};

export const resumenAnual = async (req, res, next) => {
  try {
    const anio = Number(req.query.anio || new Date().getFullYear());
    const clienteId = req.query.clienteId ? Number(req.query.clienteId) : undefined;
    const vendedorId = await resolverIdVendedor(req);

    const desde = new Date(anio, 0, 1);
    const hasta = new Date(anio + 1, 0, 1);

    // Helpers
    const monthKey = (i) => ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][i];
    const emptyYear = () => ({ ene:0,feb:0,mar:0,abr:0,may:0,jun:0,jul:0,ago:0,sep:0,oct:0,nov:0,dic:0 });
    const withMoM = (row) => {
      const k = Object.keys(row); const v = emptyYear();
      for (let i = 0; i < k.length; i++) {
        if (i === 0) v[k[i]] = 0;
        else { const a=row[k[i-1]]||0, b=row[k[i]]||0; v[k[i]] = a===0 ? 0 : ((b-a)/a)*100; }
      }
      return { valores: row, variacion: v };
    };

    // WHERE base
    const andConds = [
      { fecha_comp: { [Op.gte]: desde, [Op.lt]: hasta } },
      { [Op.or]: [{ anulada_boolean: null }, { anulada_boolean: 0 }] },
      { [Op.or]: [{ anulada: null }, { anulada: { [Op.ne]: 'S' } }] },
      { deletedAt: { [Op.is]: null } },
    ];
    if (clienteId) andConds.push({ id_cliente: clienteId });
    if (vendedorId) andConds.push({ id_vendedor: vendedorId });
    const factWhere = { [Op.and]: andConds };

    // ===== FACTURACIÓN
    // CV: (monto_gravado - monto_iva - monto_desc)  ← ajuste solicitado
    // FACT/FACT_FCE: gravado - desc
    // NC_FCE: -gravado
    // NC: -( gravado si != 0, sino total )
    const factRows = await Factura.findAll({
  attributes: [
    [Sequelize.fn('MONTH', Sequelize.col('fecha_comp')), 'mes'],
    [
      Sequelize.literal(`
        SUM(
          CASE
            WHEN UPPER(TRIM(tipo_comp)) IN ('FACTURA','FACTURA_FCE_MIPYMES','COMPROBANTE_VENTA')
              THEN (COALESCE(total,0) - COALESCE(monto_iva,0))
            WHEN UPPER(TRIM(tipo_comp)) IN ('NOTA_CREDITO','NOTA_CREDITO_FCE_MIPYMES')
              THEN -ABS(COALESCE(total,0) - COALESCE(monto_iva,0))
            WHEN UPPER(TRIM(tipo_comp)) = 'NOTA_DEBITO'
              THEN 0
              -- Si querés incluir ND, reemplazá la línea de arriba por:
              -- THEN (COALESCE(total,0) - COALESCE(monto_iva,0))
            ELSE 0
          END
        )
      `),
      'monto'
    ],
  ],
  where: factWhere,
  group: [Sequelize.fn('MONTH', Sequelize.col('fecha_comp'))],
  raw: true,
});

    const facturacion = emptyYear();
    for (const r of factRows) {
      const m = Number(r.mes) - 1;
      if (m >= 0 && m < 12) facturacion[monthKey(m)] = Number(r.monto) || 0;
    }

    // ===== CMV (cantidad * costo) con signo
    const cmvRows = await DetalleFactura.findAll({
      attributes: [
        [Sequelize.fn('MONTH', Sequelize.col('factura.fecha_comp')), 'mes'],
        [
          Sequelize.literal(`
            SUM(
              (COALESCE(\`DetalleFactura\`.\`cantidad\`,0) * COALESCE(\`DetalleFactura\`.\`costo\`,0)) *
              CASE
                WHEN UPPER(TRIM(\`factura\`.\`tipo_comp\`)) IN ('FACTURA','FACTURA_FCE_MIPYMES','COMPROBANTE_VENTA') THEN 1
                WHEN UPPER(TRIM(\`factura\`.\`tipo_comp\`)) IN ('NOTA_CREDITO','NOTA_CREDITO_FCE_MIPYMES') THEN -1
                ELSE 0
              END
            )
          `),
          'monto'
        ],
      ],
      include: [{ model: Factura, as: 'factura', attributes: [], where: factWhere }],
      group: [Sequelize.fn('MONTH', Sequelize.col('factura.fecha_comp'))],
      raw: true,
    });

    const cmv = emptyYear();
    for (const r of cmvRows) {
      const m = Number(r.mes) - 1;
      if (m >= 0 && m < 12) cmv[monthKey(m)] = Number(r.monto) || 0;
    }

    // ===== GASTOS
    const gastosRows = await ComprobantesServicios.findAll({
      attributes: [
        [Sequelize.fn('MONTH', Sequelize.col('fecha')), 'mes'],
        [Sequelize.fn('SUM', Sequelize.col('total')), 'monto'],
      ],
      where: { fecha: { [Op.gte]: desde, [Op.lt]: hasta } },
      group: [Sequelize.fn('MONTH', Sequelize.col('fecha'))],
      raw: true,
    });

    const gastos = emptyYear();
    for (const r of gastosRows) {
      const m = Number(r.mes) - 1;
      if (m >= 0 && m < 12) gastos[monthKey(m)] = Number(r.monto) || 0;
    }

    // ===== DERIVADOS
    const resultadoBruto = emptyYear();
    const resultadoFinal = emptyYear();
    for (let i = 0; i < 12; i++) {
      const k = monthKey(i);
      resultadoBruto[k] = (facturacion[k] || 0) - (cmv[k] || 0);
      resultadoFinal[k] = resultadoBruto[k] - (gastos[k] || 0);
    }

    res.json({
      anio,
      facturacion: withMoM(facturacion),
      cmv: withMoM(cmv),
      resultadoBruto: withMoM(resultadoBruto),
      gastos: withMoM(gastos),
      resultadoFinal: withMoM(resultadoFinal),
      totales: {
        facturacion: Object.values(facturacion).reduce((a, b) => a + b, 0),
        cmv: Object.values(cmv).reduce((a, b) => a + b, 0),
        gastos: Object.values(gastos).reduce((a, b) => a + b, 0),
        resultadoBruto: Object.values(resultadoBruto).reduce((a, b) => a + b, 0),
        resultadoFinal: Object.values(resultadoFinal).reduce((a, b) => a + b, 0),
      }
    });
  } catch (err) {
    console.error('❌ Error resumenAnual', err);
    next(err);
  }
};

export const gastosPorCategoria = async (req, res, next) => {
    try {
        const anio = Number(req.query.anio || new Date().getFullYear());
        const desde = new Date(anio, 0, 1);
        const hasta = new Date(anio + 1, 0, 1);

        const rows = await ComprobantesServicios.findAll({
            attributes: [
                'categoriaId',
                [Sequelize.col('categoria.nombre'), 'categoriaNombre'],
                [Sequelize.fn('MONTH', Sequelize.col('fecha')), 'mes'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'monto'],
            ],
            include: [{ model: CategoriasServicios, as: 'categoria', attributes: [] }],
            where: { fecha: { [Op.gte]: desde, [Op.lt]: hasta } },
            group: [
                'ComprobantesServicios.categoriaId',
                'categoria.nombre',
                Sequelize.fn('MONTH', Sequelize.col('fecha')),
            ],
            raw: true,
        });

        const map = {};
        for (const r of rows) {
            const catId = r.categoriaId ?? 'sin_cat';
            const catNombre = r.categoriaNombre ?? 'Sin categoría';
            if (!map[catId]) map[catId] = { categoriaId: catId, categoriaNombre: catNombre, valores: emptyYear(), total: 0 };
            const k = monthKey(Number(r.mes) - 1);
            const monto = Number(r.monto) || 0;
            map[catId].valores[k] += monto;
            map[catId].total += monto;
        }

        const out = Object.values(map).map((x) => {
            const mom = withMoM(x.valores);
            return { categoriaId: x.categoriaId, categoriaNombre: x.categoriaNombre, valores: mom.valores, variacion: mom.variacion, total: x.total };
        });

        res.json(out);
    } catch (err) {
        console.error('❌ Error gastosPorCategoria', err);
        next(err);
    }
};

export const gastosProveedoresPorCategoria = async (req, res, next) => {
    try {
        const anio = Number(req.query.anio || new Date().getFullYear());
        const categoriaId = Number(req.query.categoriaId);
        const desde = new Date(anio, 0, 1);
        const hasta = new Date(anio + 1, 0, 1);

        const rows = await ComprobantesServicios.findAll({
            attributes: [
                'proveedorId',
                [Sequelize.col('proveedor.nombre'), 'proveedorNombre'],
                [Sequelize.fn('MONTH', Sequelize.col('fecha')), 'mes'],
                [Sequelize.fn('SUM', Sequelize.col('total')), 'monto'],
            ],
            include: [{ model: ProveedoresServicios, as: 'proveedor', attributes: [] }],
            where: { fecha: { [Op.gte]: desde, [Op.lt]: hasta }, categoriaId },
            group: [
                'ComprobantesServicios.proveedorId',
                'proveedor.nombre',
                Sequelize.fn('MONTH', Sequelize.col('fecha')),
            ],
            raw: true,
        });

        const map = {};
        for (const r of rows) {
            const provId = r.proveedorId ?? 'sin_prov';
            const provNombre = r.proveedorNombre ?? 'Sin proveedor';
            if (!map[provId]) map[provId] = { proveedorId: provId, proveedorNombre: provNombre, valores: emptyYear(), total: 0 };
            const k = monthKey(Number(r.mes) - 1);
            const monto = Number(r.monto) || 0;
            map[provId].valores[k] += monto;
            map[provId].total += monto;
        }

        const out = Object.values(map).map((x) => {
            const mom = withMoM(x.valores);
            return { proveedorId: x.proveedorId, proveedorNombre: x.proveedorNombre, valores: mom.valores, variacion: mom.variacion, total: x.total };
        });

        res.json(out);
    } catch (err) {
        console.error('❌ Error gastosProveedoresPorCategoria', err);
        next(err);
    }
};

export const gastosDetalleMes = async (req, res, next) => {
    try {
        const anio = Number(req.query.anio);
        const mes = Number(req.query.mes); // 1..12
        const categoriaId = req.query.categoriaId ? Number(req.query.categoriaId) : undefined;
        const proveedorId = req.query.proveedorId ? Number(req.query.proveedorId) : undefined;

        if (!anio || !mes) return res.status(400).json({ message: "anio y mes son obligatorios" });

        const where = {
            [Op.and]: [
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('fecha')), anio),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('fecha')), mes),
            ],
            ...(categoriaId ? { categoriaId } : {}),
            ...(proveedorId ? { proveedorId } : {}),
        };

        const rows = await ComprobantesServicios.findAll({
            where,
            order: [['fecha', 'DESC'], ['id', 'DESC']],
            include: [
                { model: CategoriasServicios, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: ProveedoresServicios, as: 'proveedor', attributes: ['id', 'nombre', 'razonSocial'] },
            ],
            attributes: [
                'id', 'tipoComprobante', 'comprobante', 'fecha', 'fechaImputacion',
                'detalles', 'total', 'montoPagado', 'saldo', 'estadoFacturacion', 'observaciones'
            ]
        });

        const data = rows.map(r => ({
            id: r.id,
            fecha: r.fecha,
            tipoComprobante: r.tipoComprobante,
            comprobante: r.comprobante,
            categoriaId: r.categoria?.id ?? null,
            categoriaNombre: r.categoria?.nombre ?? 'Sin categoría',
            proveedorId: r.proveedor?.id ?? null,
            proveedorNombre: r.proveedor?.nombre ?? 'Sin proveedor',
            proveedorRazonSocial: r.proveedor?.razonSocial ?? null,
            detalles: r.detalles,
            total: Number(r.total ?? 0),
            montoPagado: Number(r.montoPagado ?? 0),
            saldo: Number(r.saldo ?? 0),
            estadoFacturacion: r.estadoFacturacion ?? null,
            observaciones: r.observaciones ?? null,
        }));

        res.json(data);
    } catch (err) {
        console.error('❌ Error gastosDetalleMes', err);
        next(err);
    }
};
