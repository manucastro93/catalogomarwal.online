import { createSignal, onMount } from "solid-js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es";
import "flatpickr/dist/flatpickr.min.css";

interface Props {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}

export default function InputFecha({ valor, onChange, placeholder }: Props) {
  const [texto, setTexto] = createSignal("");
  let inputEl: HTMLInputElement;

  onMount(() => {
    flatpickr.localize(Spanish);
    flatpickr(inputEl, {
      dateFormat: "d/m/Y",
      defaultDate: valor ? new Date(valor) : undefined,
      onChange: ([date]) => {
        if (date) {
          const iso = date.toISOString().split("T")[0];
          onChange(iso);
          setTexto(date.toLocaleDateString("es-AR"));
        }
      },
    });

    if (valor) {
      const date = new Date(valor);
      setTexto(date.toLocaleDateString("es-AR"));
    }
  });

  return (
    <div class="relative w-full max-w-xs">
      <input
        ref={(el) => (inputEl = el)}
        type="text"
        class="peer w-full border rounded px-3 py-2 h-10 appearance-none"
        placeholder=" "
        readOnly
      />
      <span class={`absolute left-3 top-2.5 text-sm text-gray-500 transition-all ${
        texto() ? "invisible opacity-0" : "opacity-100 visible"
      }`}>
        {placeholder}
      </span>
    </div>
  );
}
