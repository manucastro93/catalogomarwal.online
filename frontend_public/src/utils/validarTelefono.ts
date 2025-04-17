export function validarTelefonoArgentino(numero: string): boolean {
    const limpio = numero.replace(/\D/g, '');
  
    // Números móviles argentinos válidos:
    // - Deben tener entre 10 y 11 dígitos
    // - No deben empezar con 0 o +54 (se agregan automáticamente)
    // - Ej: 11XXXXXXXX, 351XXXXXXXX, 261XXXXXXXX
  
    const regex = /^[1-9]\d{9,10}$/;
  
    return regex.test(limpio);
  }
  