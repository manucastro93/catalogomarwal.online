import axios from 'axios';
import { Categoria, Subcategoria, Proveedor, MateriaPrima } from '../models/index.js';

const API_URL_COMPRAS = process.env.DUX_API_URL_COMPRAS;
const EMPRESA = process.env.DUX_API_EMPRESA;
const SUCURSAL = process.env.DUX_API_SUCURSAL_CASA_CENTRAL;
const API_KEY = process.env.DUX_API_KEY;

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseFloatSeguro(valor) {
  const n = parseFloat(valor);
  return isNaN(n) ? 0 : n;
}
// 1) Header correcto + sin Bearer
async function obtenerConReintentos(url, params = {}, reintentos = 5) {
  for (let i = 0; i < reintentos; i++) {
    try {
      const res = await axios.get(url, {
        headers: {
          accept: 'application/json',
          authorization: API_KEY, // <-- sin "Bearer"
        },
        params,
        timeout: 60_000,
        validateStatus: s => s < 500, // así vemos 4xx
      });

      if (res.status === 429) {
        const retry = Number(res.headers['retry-after']) || 15;
        console.warn(`⚠️ 429 Too Many Requests: esperando ${retry}s (intento ${i + 1})...`);
        await esperar(retry * 1000);
        continue;
      }
      if (res.status >= 400) {
        console.warn(`⚠️ HTTP ${res.status}:`, res.data);
        // si da 4xx distinto de 429, no reintentes en bucle: rompe
        if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
      }

      // compras suele devolver el body directo (array u objeto)
      const d = res.data;
      console.log("obtener: ", d)
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.results)) return d.results;
      if (Array.isArray(d?.data)) return d.data;
      if (Array.isArray(d?.items)) return d.items;
      // último recurso: primer array encontrado
      const firstArray = d && typeof d === 'object' ? Object.values(d).find(v => Array.isArray(v)) : null;
      return firstArray || (d ?? []);
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        await esperar(3000 + i * 2000);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`❌ Fallaron todos los intentos para ${url}`);
}

// 2) Formato correcto de fechas DD/MM/YYYY
function ddmmyyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// 3) Construcción de URL/params según doc (sin limit/offset, sin idSucursal)
export async function sincronizarComprasDesdeDux(diasAtras = 2) {
  const hoy = new Date();
  const desdeDate = new Date(hoy);
  desdeDate.setDate(hoy.getDate() - Number(diasAtras));

  const fechaDesde = ddmmyyyy(desdeDate); // "DD/MM/YYYY"
  const fechaHasta = ddmmyyyy(hoy);

  let creadas = 0, actualizadas = 0, totalProcesadas = 0;

  console.log(`⏳ Iniciando sincronización de facturas desde ${fechaDesde} hasta ${fechaHasta}...`);

  const url = `${API_URL_COMPRAS}`;
  // Según doc: fechaDesde, fechaHasta, idEmpresa. (Probá sin idSucursal primero)
  const params = {
    fechaDesde,
    fechaHasta,
    idEmpresa: EMPRESA,
    idSucursal: SUCURSAL, // 👉 si el endpoint lo soporta, habilitalo; si no, dejar comentado
  };

  let facturas = [];
  try {
    facturas = await obtenerConReintentos(url, params);
  } catch (e) {
    console.error('❌ Error al consultar compras:', e?.message || e);
    return { creadas, actualizadas, total: 0 };
  }

  if (!Array.isArray(facturas) || facturas.length === 0) {
    console.log('✅ No hay facturas en el rango.');
    return { creadas, actualizadas, total: 0 };
  }

  for (const f of facturas) {
    // tu lógica de persistencia
    totalProcesadas++;
  }

  console.log(`✅ Sincronización de facturas finalizada. Total: ${totalProcesadas}, creadas: ${creadas}, actualizadas: ${actualizadas}`);
  return { creadas, actualizadas, total: totalProcesadas };
}
