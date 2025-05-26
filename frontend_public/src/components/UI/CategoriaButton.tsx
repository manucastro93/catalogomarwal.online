import { splitProps } from 'solid-js';

interface Props {
  nombreWeb?: string;
  nombre?: string;
  activa: boolean;
  onClick: () => void;
}

export default function CategoriaButton(props: Props) {
  const [local, others] = splitProps(props, ['nombreWeb', 'nombre', 'activa', 'onClick']);

  const texto = () => local.nombreWeb || local.nombre || 'Sin nombre';

  return (
    <button
      onClick={local.onClick}
      class={
        'text-sm px-4 py-2 w-full text-left transition-all duration-150 ' +
        (local.activa
          ? 'bg-black text-white font-bold'
          : 'text-gray-800 hover:bg-gray-100')
      }
      {...others}
    >
      {texto()}
    </button>
  );
}
