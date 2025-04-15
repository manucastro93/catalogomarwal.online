export const mostrarMensaje = (mensaje: string, tipo: 'exito' | 'error' = 'exito') => {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
  
    toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white text-sm z-[9999]
      ${tipo === 'exito' ? 'bg-green-600' : 'bg-red-600'}`;
  
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add('opacity-0');
    }, 2500);
  
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };
  