// Collation que usamos para comparar SKU vs codItem en Dux.
// Si tu server no tiene esta, podes usar 'utf8mb4_general_ci'.
export const COLLATE = 'utf8mb4_unicode_ci';

// Parser robusto de "p.total" en Dux (tipo "$ 1.234,56")
export const TOTAL_DUX_EXPR = `
  CAST(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(p.total, 'AR$', ''),
        '$', ''),
      '.', ''),
    ',', '.') AS DECIMAL(18,2)
  )
`;

// Elige el "top" por totalFacturado; si empata, por cantidad
export function pickTop(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (Number(b.totalFacturado) > Number(a.totalFacturado)) return b;
  if (Number(b.totalFacturado) < Number(a.totalFacturado)) return a;
  return Number(b.cantidad) > Number(a.cantidad) ? b : a;
}
