import { formatearTelefonoArgentino } from "@/utils/formatearTelefono";

export function validarCamposCliente({ nombre, telefono, email, direccion, cuit, localidad, provincia, verificado }: any) {
  const errores: Record<string, string> = {};

  const locString = typeof localidad() === 'object' ? localidad()?.nombre || '' : localidad();
  const provString = typeof provincia() === 'object' ? provincia()?.nombre || '' : provincia();

  if (!nombre().trim()) errores.nombre = "El nombre es obligatorio";
  if (!telefono().trim()) {
    errores.telefono = "El teléfono es obligatorio";
  } else if (!formatearTelefonoArgentino(telefono())) {
    errores.telefono = "Número inválido. Usá formato 11XXXXXXXX o +54911XXXXXXXX.";
  } else if (!verificado) {
    errores.telefono = "Primero validá tu número de WhatsApp";
  }

  if (!email().trim() || !email().includes("@")) errores.email = "El email no es válido";
  if (!direccion().trim()) errores.direccion = "La dirección es obligatoria";
  if (!cuit().trim()) errores.cuit = "El CUIT/CUIL es obligatorio";
  if (!locString.trim()) errores.localidad = "La localidad es obligatoria";
  if (!provString.trim()) errores.provincia = "La provincia es obligatoria";

  return errores;
}