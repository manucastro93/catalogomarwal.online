import { createSignal, onMount } from "solid-js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es";
import dayjs from "dayjs";
import "dayjs/locale/es";

interface Props {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  class?: string;
}

export default function InputFecha({ valor, onChange, placeholder = "", class: className = "" }: Props) {
  const [texto, setTexto] = createSignal("");
  let inputEl: HTMLInputElement;

  onMount(() => {
    flatpickr(inputEl, {
      locale: Spanish,
      dateFormat: "d-m-Y",
      defaultDate: valor ? dayjs(valor).toDate() : undefined,
      onChange: ([date]) => {
        if (date) {
          onChange(dayjs(date).format("YYYY-MM-DD"));
          setTexto(dayjs(date).locale('es').format("DD-MM-YYYY"));
        }
      },
    });

    if (valor) {
      setTexto(dayjs(valor).locale('es').format("DD-MM-YYYY"));
    }
  });

  return (
    <div class={`relative w-full max-w-xs ${className}`}>
      <input
        ref={(el) => (inputEl = el)}
        type="text"
        value={texto()}
        class="peer w-full border rounded px-3 pt-4 pb-2 h-12 appearance-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder=" "
        readOnly
      />
      <label class="absolute left-3 top-2 text-gray-500 text-xs transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-500">
        {placeholder}
      </label>
    </div>
  );
}
