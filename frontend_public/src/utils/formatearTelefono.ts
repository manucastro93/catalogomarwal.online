export function formatearTelefonoArgentino(numero: string): string {
    const limpio = numero.replace(/\D/g, '');
  
    if (limpio.startsWith('549')) return `+${limpio}`;
    if (limpio.startsWith('54')) return `+${limpio}`;
    if (limpio.startsWith('0')) return `+54${limpio.slice(1)}`;
    if (limpio.length >= 10 && limpio.length <= 11) return `+549${limpio}`;
  
    return numero; // fallback
  }

export function formatearTelefonoVisual(valor: string): string {
  const limpio = valor.replace(/\D/g, "").slice(0, 11);

  if (limpio.length > 11) return null as any;
  const parte1 = limpio.slice(0, 3);
  const parte2 = limpio.slice(3, 7);
  const parte3 = limpio.slice(7, 11);

  return [parte1, parte2, parte3].filter(Boolean).join("-");
}

 
export function validarTelefonoArgentino(numero: string): boolean {
    const limpio = numero.replace(/\D/g, '');
  
    // Números móviles argentinos válidos:
    // - Deben tener entre 10 y 11 dígitos
    // - No deben empezar con 0 o +54 (se agregan automáticamente)
    // - Ej: 11XXXXXXXX, 351XXXXXXXX, 261XXXXXXXX
  
    const regex = /^[1-9]\d{9,10}$/;
  
    return regex.test(limpio);
  }