import { createSignal } from "solid-js";
import { enviarCodigoWhatsapp, verificarCodigoWhatsapp } from "@/services/cliente.service";

export function useValidacionWhatsapp(telefono: () => string) {
  const [codigoVerificacion, setCodigoVerificacion] = createSignal("");
  const [codigoEnviado, setCodigoEnviado] = createSignal(false);
  const [verificado, setVerificado] = createSignal(false);
  const [errorCodigo, setErrorCodigo] = createSignal("");
  const [enviandoCodigo, setEnviandoCodigo] = createSignal(false);
  const [tiempoRestante, setTiempoRestante] = createSignal(0);

  let timer: ReturnType<typeof setInterval> | null = null;

  const enviarCodigo = async () => {
    setEnviandoCodigo(true);
    setErrorCodigo("");
    try {
      await enviarCodigoWhatsapp(telefono().replace(/[^0-9+]/g, ""));
      setCodigoEnviado(true);
      setTiempoRestante(60);
      timer = setInterval(() => {
        setTiempoRestante((t) => {
          if (t <= 1) {
            if (timer) clearInterval(timer);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      setErrorCodigo("No se pudo enviar el código");
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const verificarCodigo = async () => {
    try {
      await verificarCodigoWhatsapp(
        telefono().replace(/[^0-9+]/g, ""),
        codigoVerificacion()
      );
      setVerificado(true);
      setErrorCodigo("");
    } catch {
      setErrorCodigo("Código incorrecto o expirado");
    }
  };

  return {
    codigoVerificacion,
    setCodigoVerificacion,
    codigoEnviado,
    verificado,
    errorCodigo,
    enviandoCodigo,
    tiempoRestante,
    enviarCodigo,
    verificarCodigo,
  };
}