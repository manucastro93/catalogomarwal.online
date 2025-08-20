function normalizarDireccion(domicilioRaw = "") {
  let s = (domicilioRaw || "").trim();

  // Quitar paréntesis y su contenido: (RETIRA DE TRANSPORTE), (DEPOSITO), etc
  s = s.replace(/\([^)]*\)/g, " ");

  // Quitar indicaciones a partir de palabras clave comunes
  s = s.replace(/\b(retira|retiro|transporte|deposito|dep[óo]sito|sucursal)\b.*$/i, " ");

  // Quitar piso/depto: "9º A", "9°A", "PB", "1er", "2do", etc
  s = s.replace(/\b(\d+\s*(º|°)?\s*[a-zA-Z])\b/g, " ");
  s = s.replace(/\b(PB|p\.b\.|planta baja|1er|2do|3ro)\b/gi, " ");

  // Colapsar espacios y comas
  s = s.replace(/[,\s]+/g, " ").trim();

  // Si quedó muy corto, devolvemos vacío para forzar fallback
  if (s.length < 4) return "";

  return s;
}

async function geocodeNominatim(q) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", q);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Marwal-ClientesDux/1.0 (contacto@marwal.com)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  const hit = data[0];
  return {
    lat: parseFloat(hit.lat),
    lon: parseFloat(hit.lon),
  };
}

export async function geocodificarClienteDuxFila(c) {
  const provincia = (c.provincia || "").trim();
  const localidad = (c.localidad || "").trim();
  const domicilioNorm = normalizarDireccion(c.domicilio || "");

  // 1) Dirección completa
  if (domicilioNorm && localidad && provincia) {
    const q = `${domicilioNorm}, ${localidad}, ${provincia}, Argentina`;
    const p = await geocodeNominatim(q);
    if (p) return { ...p, precision: "direccion", fuente: "nominatim" };
  }

  // 2) Centroide de localidad
  if (localidad && provincia) {
    const q = `${localidad}, ${provincia}, Argentina`;
    const p = await geocodeNominatim(q);
    if (p) return { ...p, precision: "localidad", fuente: "nominatim" };
  }

  // 3) Centroide de provincia
  if (provincia) {
    const q = `${provincia}, Argentina`;
    const p = await geocodeNominatim(q);
    if (p) return { ...p, precision: "provincia", fuente: "nominatim" };
  }

  return { lat: null, lon: null, precision: "ninguno", fuente: null };
}
