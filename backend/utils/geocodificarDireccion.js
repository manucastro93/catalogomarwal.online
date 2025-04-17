import fetch from 'node-fetch';

export const geocodificarDireccion = async (direccionCompleta) => {
  const apiKey = process.env.OPENCAGE_API_KEY;
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(direccionCompleta)}&key=${apiKey}&language=es&countrycode=ar&limit=1`;

  const res = await fetch(url);
  const data = await res.json();

  if (data?.results?.length > 0) {
    const { lat, lng } = data.results[0].geometry;
    return { latitud: lat, longitud: lng };
  }

  return { latitud: null, longitud: null };
};
