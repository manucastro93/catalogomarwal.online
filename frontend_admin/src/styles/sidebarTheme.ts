const theme = {
  
  // Fondo general
  fondo: 'bg-[#252C37]',
  fondoItemActivo: 'bg-[#1C222D]',
  fondoHover: 'bg-[#2F3744]',
  borde: 'border-[#334155]',

  // Tipografía y color
  texto: 'text-white',
  textoHover: 'hover:text-[#38BDF8]',
  fuente: 'font-[Inter,sans-serif]',

  // Ítems principales (nivel raíz)
  itemBase: 'flex items-center w-full text-white transition-colors',
  itemIconoWrapper: 'w-16 flex justify-center items-center',
  itemTexto: 'ml-2 text-[18px] uppercase',
  itemActivo: 'bg-slate-900',
  itemHover: 'hover:bg-slate-700',

  // Subítems (nivel 1)
  paddingSubitem: 'pl-12 py-2',
  textoSubitem: 'text-[17px] text-[#E2E8F0] hover:text-[#38BDF8]',
  subitemActivo: 'bg-slate-800 text-white font-semibold',

  // Sub-subítems (nivel 2)
  paddingSubSubitem: 'pl-16 py-1.5',
  textoSubSubitem: 'text-[16px] text-[#E2E8F0] hover:text-[#38BDF8]',
  subsubitemActivo: 'bg-slate-800 text-white font-semibold',

  // Títulos de sección
  tituloSeccion: 'text-[11px] tracking-widest font-medium text-[#60a5fa] py-2 px-4',

  // Extras
  redondeado: 'rounded-md',
  paddingX: 'px-4',
  paddingY: 'py-3',
};

export default theme;
