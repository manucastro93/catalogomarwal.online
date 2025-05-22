import { createSignal, Show, onMount, onCleanup, For } from "solid-js";
import { capitalizarTexto, formatearCUIT } from "@/utils/formato";
import { formatearTelefonoArgentino, formatearTelefonoVisual } from "@/utils/formatearTelefono";
import { useDireccionAutocomplete } from "@/hooks/useDireccionAutocomplete";
import { useValidacionWhatsapp } from "@/hooks/useValidacionWhatsapp";
import { validarCamposCliente } from "@/utils/validarCamposCliente";

interface Props {
  onConfirmar: (datosCliente: any) => void;
}

export default function FormularioCliente({ onConfirmar }: Props) {
  const datosGuardados = JSON.parse(localStorage.getItem("clienteDatos") || "null");

  const [nombre, setNombre] = createSignal(datosGuardados?.nombre || "");
  const [telefono, setTelefono] = createSignal(datosGuardados?.telefono || "");
  const [email, setEmail] = createSignal(datosGuardados?.email || "");
  const [direccion, setDireccion] = createSignal(datosGuardados?.direccion || "");
  const [razonSocial, setRazonSocial] = createSignal(datosGuardados?.razonSocial || "");
  const [cuit, setCuit] = createSignal(datosGuardados?.cuit_cuil || "");
  const [localidad, setLocalidad] = createSignal(datosGuardados?.localidad || "");
  const [provincia, setProvincia] = createSignal(datosGuardados?.provincia || "");
  const [codigoPostal, setCodigoPostal] = createSignal(datosGuardados?.codigoPostal || "");
  const [errores, setErrores] = createSignal<Record<string, string>>({});

  const {
    inputDireccion,
    setInputDireccion,
    sugerencias,
    mostrarSugerencias,
    setMostrarSugerencias,
    errorDireccion,
    handleInput,
    handleSelect,
    bloquear,
  } = useDireccionAutocomplete({ direccion, setDireccion, setCodigoPostal, setLocalidad, setProvincia });

  const {
    verificado,
    codigoVerificacion,
    setCodigoVerificacion,
    codigoEnviado,
    errorCodigo,
    enviandoCodigo,
    tiempoRestante,
    enviarCodigo,
    verificarCodigo,
  } = useValidacionWhatsapp(telefono);

  const persistirDatos = () => {
    localStorage.setItem("clienteDatos", JSON.stringify({
      nombre: nombre(),
      telefono: telefono(),
      email: email(),
      direccion: direccion(),
      razonSocial: razonSocial(),
      cuit_cuil: cuit(),
      localidad: localidad(),
      provincia: provincia(),
      codigoPostal: codigoPostal(),
    }));
  };

  onMount(() => {
    setMostrarSugerencias(false);
    setInputDireccion(direccion());
  });

  onCleanup(persistirDatos);

  const enviar = () => {
    const nuevosErrores = validarCamposCliente({ nombre, telefono, email, direccion, cuit, localidad, provincia, verificado });
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const vendedorRaw = localStorage.getItem("vendedor");
    const vendedorId = vendedorRaw ? JSON.parse(vendedorRaw).id : undefined;

    onConfirmar({
      nombre: capitalizarTexto(nombre()),
      telefono: telefono(),
      email: email().toLowerCase(),
      direccion: capitalizarTexto(direccion()),
      razonSocial: capitalizarTexto(razonSocial()),
      cuit_cuil: cuit(),
      provincia: provincia(),
      localidad: localidad(),
      codigoPostal: codigoPostal(),
      vendedorId: Number(vendedorId),
    });
  };

return (
  <div class="text-sm space-y-2">
    {/* Nombre */}
    <input
      type="text"
      id="nombre"
      inputmode="text"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm ${errores().nombre ? "border-red-500" : ""}`}
      placeholder="Nombre *"
      value={nombre()}
      onInput={(e) => {
        setNombre(capitalizarTexto(e.currentTarget.value));
        persistirDatos();
      }}
    />
    <Show when={errores().nombre}>
      <p class="text-red-600 text-xs">{errores().nombre}</p>
    </Show>

    {/* Teléfono */}
    <input
      type="tel"
      id="telefono"
      inputmode="numeric"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm ${errores().telefono ? "border-red-500" : ""}`}
      placeholder="Whatsapp. Ej: 011XXXXXXXX"
      value={telefono()}
      maxLength={13}
      onBeforeInput={(e) => {
        if (!/^[0-9]$/.test(e.data ?? "") && e.inputType !== "deleteContentBackward") {
          e.preventDefault();
        }
      }}
      onInput={(e) => {
        let limpio = e.currentTarget.value.replace(/[^0-9]/g, "");
        if (limpio.length > 11) limpio = limpio.slice(0, 11);
        setTelefono(formatearTelefonoVisual(limpio));
        persistirDatos();
      }}
    />
    <Show when={errores().telefono}>
      <p class="text-red-600 text-xs">{errores().telefono}</p>
    </Show>
      <Show when={formatearTelefonoArgentino(telefono()) && !verificado()}>
  <div class="mt-1 flex gap-2 items-center">
    <button
      class="px-3 py-1 bg-blue-600 text-white rounded text-xs"
      disabled={enviandoCodigo() || tiempoRestante() > 0}
      onClick={enviarCodigo}
    >
      {enviandoCodigo() ? "Enviando..." : tiempoRestante() > 0 ? `Reintentar (${tiempoRestante()})` : "Validar"}
    </button>
    <Show when={codigoEnviado()}>
      <input
        type="text"
        maxlength="6"
        class="border rounded px-2 py-1 w-24 text-center text-sm"
        placeholder="Código"
        value={codigoVerificacion()}
        onInput={(e) => setCodigoVerificacion(e.currentTarget.value)}
      />
      <button
        class="px-2 py-1 bg-green-600 text-white rounded text-xs"
        onClick={verificarCodigo}
      >
        Confirmar
      </button>
    </Show>
  </div>
  <Show when={errorCodigo()}>
    <p class="text-red-600 text-xs mt-1">{errorCodigo()}</p>
  </Show>
</Show>

<Show when={verificado()}>
  <p class="text-green-600 text-xs mt-1">✅ Número verificado</p>
</Show>

    {/* Email */}
    <input
      type="email"
      id="email"
      inputmode="email"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm ${errores().email ? "border-red-500" : ""}`}
      placeholder="Email *"
      value={email()}
      onInput={(e) => {
        setEmail(e.currentTarget.value);
        persistirDatos();
      }}
    />
    <Show when={errores().email}>
      <p class="text-red-600 text-xs">{errores().email}</p>
    </Show>

    {/* Dirección */}
    <input
      type="text"
      id="direccion"
      inputmode="text"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm ${errores().direccion || errorDireccion() ? "border-red-500" : ""}`}
      placeholder="Dirección completa *"
      value={direccion()}
      onInput={(e) => {
        const valor = capitalizarTexto(e.currentTarget.value);
        setDireccion(valor);
        handleInput(valor); // ✅ llama al hook correctamente
        persistirDatos();
      }}
    />
    <Show when={errorDireccion()}>
      <p class="text-red-600 text-xs">Seleccioná una dirección válida con altura.</p>
    </Show>
    <Show when={errores().direccion}>
      <p class="text-red-600 text-xs">{errores().direccion}</p>
    </Show>

    {/* Sugerencias */}
    <Show when={mostrarSugerencias() && sugerencias().length}>
        <ul class="border bg-white rounded text-sm max-h-40 overflow-y-auto">
          <For each={sugerencias()}>
            {(dir) => (
              <li class="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelect(dir)}>
                {dir.descripcion}
              </li>
            )}
          </For>
        </ul>
      </Show>


    {/* Localidad */}
    <input
      type="text"
      inputmode="text"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm bg-gray-100 ${errores().localidad ? "border-red-500" : ""}`}
      placeholder="Localidad *"
      value={typeof localidad() === "object" ? localidad()?.nombre || "" : localidad()}
      readOnly
    />
    <Show when={errores().localidad}>
      <p class="text-red-600 text-xs">{errores().localidad}</p>
    </Show>

    {/* Provincia */}
    <input
      type="text"
      inputmode="text"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm bg-gray-100 ${errores().provincia ? "border-red-500" : ""}`}
      placeholder="Provincia *"
      value={typeof provincia() === "object" ? provincia()?.nombre || "" : provincia()}
      readOnly
    />
    <Show when={errores().provincia}>
      <p class="text-red-600 text-xs">{errores().provincia}</p>
    </Show>

    {/* Código Postal */}
    <input
      type="text"
      inputmode="numeric"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class="w-full border px-3 py-2 rounded text-sm bg-gray-100"
      placeholder="Código Postal"
      value={codigoPostal()}
      readOnly
    />

    {/* Razón Social */}
    <input
      type="text"
      id="razonSocial"
      inputmode="text"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class="w-full border px-3 py-2 rounded text-sm"
      placeholder="Razón social o Local (opcional)"
      value={razonSocial()}
      onInput={(e) => {
        setRazonSocial(capitalizarTexto(e.currentTarget.value));
        persistirDatos();
      }}
    />

    {/* CUIT */}
    <input
      type="text"
      id="cuit"
      inputmode="numeric"
      autocomplete="new-password"
      autocorrect="off"
      spellcheck={false}
      class={`w-full border px-3 py-2 rounded text-sm ${errores().cuit ? "border-red-500" : ""}`}
      placeholder="CUIT / CUIL *"
      value={cuit()}
      maxLength={12}
      onBeforeInput={(e) => {
        if (!/^[0-9]$/.test(e.data ?? "") && e.inputType !== "deleteContentBackward") {
          e.preventDefault();
        }
      }}
      onInput={(e) => {
        let limpio = e.currentTarget.value.replace(/[^0-9]/g, "");
        if (limpio.length > 11) limpio = limpio.slice(0, 11);
        setCuit(formatearCUIT(limpio));
        persistirDatos();
      }}
    />
    <Show when={errores().cuit}>
      <p class="text-red-600 text-xs">{errores().cuit}</p>
    </Show>

    {/* Confirmar */}
    <button
      class="w-full bg-black text-white py-2 rounded mt-2 text-sm"
      onClick={enviar}
    >
      Confirmar pedido
    </button>
  </div>
);

}
