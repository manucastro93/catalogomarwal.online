export function formatearTelefonoArgentino(numero: string): string {
    const limpio = numero.replace(/\D/g, '');
  
    if (limpio.startsWith('549')) return `+${limpio}`;
    if (limpio.startsWith('54')) return `+${limpio}`;
    if (limpio.startsWith('0')) return `+54${limpio.slice(1)}`;
    if (limpio.length >= 10 && limpio.length <= 11) return `+549${limpio}`;
  
    return numero; // fallback
  }
  