import {
  createSignal,
  Show,
  onMount,
  onCleanup,
  For,
  createMemo,
  createEffect,
} from "solid-js";
import { capitalizarTexto, formatearCUIT } from "@/utils/formato";
import {
  formatearTelefonoArgentino,
  formatearTelefonoVisual,
} from "@/utils/formatearTelefono";
import { useDireccionAutocomplete } from "@/hooks/useDireccionAutocomplete";
import { useValidacionWhatsapp } from "@/hooks/useValidacionWhatsapp";
import { validarCamposCliente } from "@/utils/validarCamposCliente";

interface Props {
  onConfirmar: (datosCliente: any) => void;
}

export default function FormularioCliente({ onConfirmar }: Props) {
  const datosGuardados = JSON.parse(
    localStorage.getItem("clienteDatos") || "null"
  );

  const [nombre, setNombre] = createSignal(datosGuardados?.nombre || "");
  const [telefono, setTelefono] = createSignal(datosGuardados?.telefono || "");
  const [telefonoValidado, setTelefonoValidado] = createSignal(
    datosGuardados?.telefonoValidado || false
  );
  const [errorTelefonoFormato, setErrorTelefonoFormato] = createSignal("");
  const [email, setEmail] = createSignal(datosGuardados?.email || "");
  const [direccion, setDireccion] = createSignal(
    datosGuardados?.direccion || ""
  );
  const [razonSocial, setRazonSocial] = createSignal(
    datosGuardados?.razonSocial || ""
  );
  const [cuit, setCuit] = createSignal(datosGuardados?.cuit_cuil || "");
  const [transporte, setTransporte] = createSignal(
    datosGuardados?.transporte || ""
  );
  const [localidad, setLocalidad] = createSignal(
    datosGuardados?.localidad || ""
  );
  const [provincia, setProvincia] = createSignal(
    datosGuardados?.provincia || ""
  );
  const [codigoPostal, setCodigoPostal] = createSignal(
    datosGuardados?.codigoPostal || ""
  );
  const [errores, setErrores] = createSignal<Record<string, string>>({});

  const telefonoLimpio = createMemo(() => telefono().replace(/\D/g, ""));
  const telefonoValido = createMemo(() => telefonoLimpio().length === 11);

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
  } = useDireccionAutocomplete({
    direccion,
    setDireccion,
    setCodigoPostal,
    setLocalidad,
    setProvincia,
  });

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
    localStorage.setItem(
      "clienteDatos",
      JSON.stringify({
        nombre: nombre(),
        telefono: telefono(),
        telefonoValidado: telefonoValidado(),
        email: email(),
        direccion: direccion(),
        razonSocial: razonSocial(),
        cuit_cuil: cuit(),
        transporte: transporte(),
        localidad: localidad(),
        provincia: provincia(),
        codigoPostal: codigoPostal(),
      })
    );
  };

  onMount(() => {
    setMostrarSugerencias(false);
    setInputDireccion(direccion());
  });

  onCleanup(persistirDatos);

  createEffect(() => {
    if (
      telefono().replace(/\D/g, "") !==
      datosGuardados?.telefono?.replace(/\D/g, "")
    ) {
      setTelefonoValidado(false);
    }
  });

  const enviar = () => {
    const nuevosErrores = validarCamposCliente({
      nombre,
      telefono,
      email,
      direccion,
      cuit,
      localidad,
      provincia,
      verificado,
    });
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
      nro_doc: cuit(),
      transporte: transporte(),
      provincia: provincia(),
      localidad: localidad(),
      codigoPostal: codigoPostal(),
      vendedorId: Number(vendedorId),
    });
  };

  return (
    <div class="text-sm space-y-2">
      {/* Teléfono */}
      <div class="relative w-full">
        <input
          type="tel"
          id="telefono"
          inputmode="numeric"
          autocomplete="new-password"
          autocorrect="off"
          spellcheck={false}
          class={`w-full border px-3 py-2 pr-10 rounded text-sm ${
            errores().telefono || errorTelefonoFormato() ? "border-red-500" : ""
          }`}
          placeholder="Whatsapp. Ej: 011XXXXXXXX"
          value={telefono()}
          maxLength={13}
          disabled={telefonoValidado()}
          onBeforeInput={(e) => {
            if (
              !/^[0-9]$/.test(e.data ?? "") &&
              e.inputType !== "deleteContentBackward"
            ) {
              e.preventDefault();
            }
          }}
          onInput={(e) => {
            setCodigoVerificacion("");
            setTelefonoValidado(false);
            setErrorTelefonoFormato("");
            let limpio = e.currentTarget.value.replace(/[^0-9]/g, "");
            if (limpio.length > 11) limpio = limpio.slice(0, 11);
            setTelefono(formatearTelefonoVisual(limpio));
            persistirDatos();
          }}
          onBlur={() => {
            const limpio = telefono().replace(/\D/g, "");
            if (limpio.length !== 11) {
              setErrorTelefonoFormato(
                "Ingresá un número válido con código de área (11 dígitos). Ej: 01130544702"
              );
            } else {
              setErrorTelefonoFormato("");
            }
          }}
        />
        <Show when={telefonoValido() && !verificado()}>
          <svg
            class="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </Show>
      </div>
      <Show when={errorTelefonoFormato()}>
        <p class="text-red-600 text-xs mt-1">{errorTelefonoFormato()}</p>
      </Show>

      <Show
        when={
          !telefonoValidado() &&
          telefonoValido() &&
          !verificado() &&
          !errorTelefonoFormato()
        }
      >
        <p class="text-gray-700 text-xs mt-1">
          Ingresá tu número, luego tocá el botón "Validar". Te enviaremos un
          WhatsApp con un código de 6 dígitos para verificar este número.
          Ingresalo debajo y presioná "Confirmar".
        </p>
        <div class="mt-1 flex gap-2 items-center">
          <button
            class="px-3 py-1 bg-blue-600 text-white rounded text-xs"
            disabled={enviandoCodigo() || tiempoRestante() > 0}
            onClick={enviarCodigo}
          >
            {enviandoCodigo()
              ? "Enviando..."
              : tiempoRestante() > 0
              ? `Reintentar (${tiempoRestante()})`
              : "Validar"}
          </button>
          <Show when={codigoEnviado()}>
            <input
              type="text"
              maxLength="6"
              class="border rounded px-2 py-1 w-24 text-center text-sm"
              placeholder="Código"
              value={codigoVerificacion()}
              onInput={(e) => setCodigoVerificacion(e.currentTarget.value)}
            />
            <button
              class="px-2 py-1 bg-green-600 text-white rounded text-xs"
              onClick={() => {
                verificarCodigo();
                setTelefonoValidado(true);
                persistirDatos();
              }}
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
        class={`w-full border px-3 py-2 rounded text-sm ${
          errores().email ? "border-red-500" : ""
        }`}
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

      {/* Nombre */}
      <input
        type="text"
        class="w-full border px-3 py-2 rounded text-sm"
        placeholder="Nombre *"
        value={nombre()}
        onInput={(e) => {
          setNombre(capitalizarTexto(e.currentTarget.value));
          persistirDatos();
        }}
      />

      {/* Dirección */}
      <input
        type="text"
        id="direccion"
        inputmode="text"
        autocomplete="new-password"
        autocorrect="off"
        spellcheck={false}
        class={`w-full border px-3 py-2 rounded text-sm ${
          errores().direccion || errorDireccion() ? "border-red-500" : ""
        }`}
        placeholder="Dirección completa *"
        value={direccion()}
        onInput={(e) => {
          const valor = capitalizarTexto(e.currentTarget.value);
          setDireccion(valor);
          handleInput(valor);
          persistirDatos();
        }}
      />
      <Show when={errorDireccion()}>
        <p class="text-red-600 text-xs">
          Seleccioná una dirección válida con altura.
        </p>
      </Show>
      <Show when={errores().direccion}>
        <p class="text-red-600 text-xs">{errores().direccion}</p>
      </Show>

      {/* Sugerencias */}
      <Show when={mostrarSugerencias() && sugerencias().length}>
        <ul class="border bg-white rounded text-sm max-h-40 overflow-y-auto">
          <For each={sugerencias()}>
            {(dir) => (
              <li
                class="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(dir)}
              >
                {dir.descripcion}
              </li>
            )}
          </For>
        </ul>
      </Show>

      {/* Localidad */}
      <input
        type="text"
        class={`w-full border px-3 py-2 rounded text-sm bg-gray-100 ${
          errores().localidad ? "border-red-500" : ""
        }`}
        placeholder="Localidad *"
        value={
          typeof localidad() === "object"
            ? localidad()?.nombre || ""
            : localidad()
        }
        readOnly
      />
      <Show when={errores().localidad}>
        <p class="text-red-600 text-xs">{errores().localidad}</p>
      </Show>

      {/* Provincia */}
      <input
        type="text"
        class={`w-full border px-3 py-2 rounded text-sm bg-gray-100 ${
          errores().provincia ? "border-red-500" : ""
        }`}
        placeholder="Provincia *"
        value={
          typeof provincia() === "object"
            ? provincia()?.nombre || ""
            : provincia()
        }
        readOnly
      />
      <Show when={errores().provincia}>
        <p class="text-red-600 text-xs">{errores().provincia}</p>
      </Show>

      {/* Código Postal */}
      <input
        type="text"
        inputmode="numeric"
        class="w-full border px-3 py-2 rounded text-sm bg-gray-100"
        placeholder="Código Postal"
        value={codigoPostal()}
        readOnly
      />

      {/* Razón Social */}
      <input
        type="text"
        class="w-full border px-3 py-2 rounded text-sm"
        placeholder="Razón social o Local (opcional)"
        value={razonSocial()}
        onInput={(e) => {
          setRazonSocial(capitalizarTexto(e.currentTarget.value));
          persistirDatos();
        }}
      />

      {/* Número de documento */}
      <input
        type="text"
        inputMode="numeric"
        class="w-full border px-3 py-2 rounded text-sm"
        placeholder="Número de documento *"
        value={cuit()}
        maxLength={12}
        onBeforeInput={(e) => {
          if (
            !/^[0-9]$/.test(e.data ?? "") &&
            e.inputType !== "deleteContentBackward"
          ) {
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

      {/* Transporte */}
      <input
        type="text"
        class="w-full border px-3 py-2 rounded text-sm"
        placeholder="Transporte"
        value={transporte()}
        onInput={(e) => {
          setTransporte(capitalizarTexto(e.currentTarget.value));
          persistirDatos();
        }}
      />

      {/* Confirmar */}
      <Show when={Object.keys(errores()).length > 0}>
  <p class="text-red-600 text-sm font-semibold text-center">
    ⚠️ Revisá los campos obligatorios del formulario
  </p>
</Show>
      <button
        class="w-full bg-black text-white py-2 rounded mt-2 text-sm"
        onClick={enviar}
      >
        Confirmar pedido
      </button>
    </div>
  );
}
