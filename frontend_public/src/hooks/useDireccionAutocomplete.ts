import { createSignal } from "solid-js";
import { obtenerSugerenciasDireccion, obtenerDetalleDireccion } from "@/services/ubicacion.service";

interface DireccionGoogle {
  descripcion: string;
  place_id: string;
}

export function useDireccionAutocomplete({
  direccion,
  setDireccion,
  setCodigoPostal,
  setLocalidad,
  setProvincia,
}: any) {
  const [inputDireccion, setInputDireccion] = createSignal(direccion());
  const [sugerencias, setSugerencias] = createSignal<DireccionGoogle[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = createSignal(false);
  const [errorDireccion, setErrorDireccion] = createSignal(false);
  const [bloqueoActivo, setBloqueoActivo] = createSignal(false);

  let timeout: ReturnType<typeof setTimeout>;

  const handleInput = (valor: string) => {
    setInputDireccion(valor);
    setMostrarSugerencias(true);
    if (!valor || valor.trim().length < 3 || bloqueoActivo()) return;

    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        const data = await obtenerSugerenciasDireccion(valor);
        setSugerencias(data || []);
      } catch (e) {
        console.error("Error en autocompletado:", e);
        setSugerencias([]);
      }
    }, 400);
  };

  const handleSelect = async (dir: DireccionGoogle) => {
    try {
      const detalle = await obtenerDetalleDireccion(dir.place_id);
      const comp = detalle?.components || {};
      const calle = comp.road || "";
      const altura = comp.house_number || "";
      const tieneAltura = /\d+/.test(detalle.formatted || "");
      if (!calle || (!altura && !tieneAltura)) {
        setErrorDireccion(true);
        setTimeout(() => setErrorDireccion(false), 3000);
        return;
      }

      const direccionCompleta = detalle.formatted || `${calle} ${altura}`;
      setDireccion(direccionCompleta);
      setInputDireccion(direccionCompleta);
      setCodigoPostal((comp.postcode || "").split(" ")[0]);
      setLocalidad(comp.suburb || comp.city || "");
      setProvincia(comp.state || "");
      setMostrarSugerencias(false);
      bloquear();
    } catch (err) {
      console.error("❌ Error al obtener detalle de dirección:", err);
      setErrorDireccion(true);
      setTimeout(() => setErrorDireccion(false), 3000);
    }
  };

  const bloquear = () => {
    setBloqueoActivo(true);
    setTimeout(() => setBloqueoActivo(false), 600);
  };

  return {
    inputDireccion,
    setInputDireccion,
    sugerencias,
    mostrarSugerencias,
    setMostrarSugerencias,
    errorDireccion,
    handleInput,
    handleSelect,
    bloquear,
  };
}