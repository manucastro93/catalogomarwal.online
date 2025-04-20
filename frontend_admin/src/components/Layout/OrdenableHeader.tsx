import { JSX } from 'solid-js/jsx-runtime';

interface Props {
  children: JSX.Element;
  ordenado: boolean;
  ascendente: boolean;
  onOrdenar: () => void;
}

export default function OrdenableHeader(props: Props) {
  return (
    <th class="cursor-pointer select-none" onClick={props.onOrdenar}>
      {props.children}
      {props.ordenado && (
        <span class="ml-1">{props.ascendente ? '▲' : '▼'}</span>
      )}
    </th>
  );
}
