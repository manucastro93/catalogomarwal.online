import fetch from 'node-fetch';

export const geocodificarDireccionExtendida = async (direccionCompleta) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(direccionCompleta)}&key=${apiKey}&language=es&region=ar`;

  const res = await fetch(url);
  const data = await res.json();

  if (data?.results?.length > 0) {
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    const getComponent = (type) =>
      result.address_components.find((c) => c.types.includes(type))?.long_name || "";

    return {
      latitud: lat,
      longitud: lng,
      ciudad: getComponent("locality") || getComponent("sublocality") || getComponent("administrative_area_level_2") || "",
      provincia: getComponent("administrative_area_level_1") || "",
    };
  }

  return {
    latitud: null,
    longitud: null,
    ciudad: '',
    provincia: '',
  };
};
