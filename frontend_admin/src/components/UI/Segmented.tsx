// src/components/UI/Segmented.tsx
type Props = {
  value: "cantidad" | "monto";
  onChange: (v: "cantidad" | "monto") => void;
};
export default function Segmented(props: Props) {
  return (
    <div class="inline-flex bg-gray-100 rounded-full p-1 select-none">
      {(["cantidad","monto"] as const).map(op => (
        <button
          class={`px-3 py-1 rounded-full transition ${
            props.value === op ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
          onClick={() => props.onChange(op)}
        >
          {op === "cantidad" ? "Cantidad" : "Monto"}
        </button>
      ))}
    </div>
  );
}
