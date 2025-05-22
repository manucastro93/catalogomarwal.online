import {
  createSignal,
  Show,
  For,
  onCleanup,
  onMount,
  createEffect,
} from "solid-js";
import { capitalizarTexto, formatearCUIT } from "@/utils/formato";
import {
  formatearTelefonoArgentino,
  formatearTelefonoVisual,
} from "@/utils/formatearTelefono";
import {
  obtenerSugerenciasDireccion,
  obtenerDetalleDireccion,
} from "@/services/ubicacion.service";

interface DireccionGoogle {
  descripcion: string;
  place_id: string;
}

interface Props {
  onConfirmar: (datosCliente: any) => void;
}

export default function FormularioCliente({ onConfirmar }: Props) {
  const datosGuardados = JSON.parse(
    localStorage.getItem("clienteDatos") || "null"
  );

  const [nombre, setNombre] = createSignal(datosGuardados?.nombre || "");
  const [telefono, setTelefono] = createSignal(datosGuardados?.telefono || "");
  const [email, setEmail] = createSignal(datosGuardados?.email || "");
  const [direccion, setDireccion] = createSignal(datosGuardados?.direccion || "");
  const [razonSocial, setRazonSocial] = createSignal(datosGuardados?.razonSocial || "");
  const [cuit, setCuit] = createSignal(datosGuardados?.cuit_cuil || "");
  const [localidad, setLocalidad] = createSignal(datosGuardados?.localidad || "");
  const [provincia, setProvincia] = createSignal(datosGuardados?.provincia || "");
  const [codigoPostal, setCodigoPostal] = createSignal(datosGuardados?.codigoPostal || "");

  const [inputDireccion, setInputDireccion] = createSignal(direccion());
  const [sugerencias, setSugerencias] = createSignal<DireccionGoogle[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = createSignal(false);
  const [errorDireccion, setErrorDireccion] = createSignal(false);
  const [errores, setErrores] = createSignal<Record<string, string>>({});
  const [bloqueoActivo, setBloqueoActivo] = createSignal(false);

  const persistirDatos = () => {
    localStorage.setItem(
      "clienteDatos",
      JSON.stringify({
        nombre: nombre(),
        telefono: telefono(),
        email: email(),
        direccion: direccion(),
        razonSocial: razonSocial(),
        cuit_cuil: cuit(),
        localidad: localidad(),
        provincia: provincia(),
        codigoPostal: codigoPostal(),
      })
    );
  };

  onMount(() => {
    setMostrarSugerencias(false);
    setInputDireccion(datosGuardados?.direccion || "");
  });

  onCleanup(persistirDatos);

  createEffect(() => {
    const q = inputDireccion();
    if (!q || q.trim().length < 3 || bloqueoActivo()) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/autocomplete?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSugerencias(
          (data.predictions || []).map((p: any) => ({
            descripcion: p.description,
            place_id: p.place_id,
          }))
        );
      } catch (e) {
        console.error("Error en autocompletado:", e);
        setSugerencias([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  });

  const bloquear = () => {
    setBloqueoActivo(true);
    setTimeout(() => setBloqueoActivo(false), 600);
  };

const handleSelectDireccion = async (dir: DireccionGoogle) => {
  try {
    const detalle = await obtenerDetalleDireccion(dir.place_id);
    const comp = detalle?.components || {};

    const calle = comp.road || "";
    const altura = comp.house_number || "";
    const tieneAltura = /\d+/.test(detalle.formatted || "");

    if (!calle || (!altura && !tieneAltura)) {
      setErrorDireccion(true);
      setTimeout(() => setErrorDireccion(false), 3000);
      return;
    }

    const direccionCompleta = detalle.formatted || `${calle} ${altura}`;
    setDireccion(direccionCompleta);
    setInputDireccion(direccionCompleta);
    setCodigoPostal((comp.postcode || "").split(" ")[0]);
    setLocalidad(comp.suburb || comp.city || "");
    setProvincia(comp.state || "");

    persistirDatos();
    bloquear();
    setMostrarSugerencias(false);
  } catch (err) {
    console.error("❌ Error al obtener detalle de dirección:", err);
    setErrorDireccion(true);
    setTimeout(() => setErrorDireccion(false), 3000);
  }
};

  const enviar = () => {
    const nuevosErrores: Record<string, string> = {};

    const locString = typeof localidad() === 'object' ? localidad()?.nombre || '' : localidad();
    const provString = typeof provincia() === 'object' ? provincia()?.nombre || '' : provincia();

    if (!nombre().trim()) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!telefono().trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!formatearTelefonoArgentino(telefono())) {
      nuevosErrores.telefono = "El número no es válido. Usá formato 11XXXXXXXX o +54911XXXXXXXX.";
    }
    if (!email().trim() || !email().includes("@")) nuevosErrores.email = "El email no es válido";
    if (!direccion().trim()) nuevosErrores.direccion = "La dirección es obligatoria";
    if (!cuit().trim()) nuevosErrores.cuit = "El CUIT/CUIL es obligatorio";
    if (!locString.trim()) nuevosErrores.localidad = "La localidad es obligatoria";
    if (!provString.trim()) nuevosErrores.provincia = "La provincia es obligatoria";

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
      provincia: provString,
      localidad: locString,
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
        class={`w-full border px-3 py-2 rounded text-sm ${errores().telefono ? "border-red-500" : ""}`}
        placeholder="Whatsapp. Ej: 011-XXXX-XXXX"
        value={telefono()}
        onBeforeInput={(e) => {
          if (!/^[0-9]$/.test(e.data ?? "") && e.inputType !== "deleteContentBackward") {
            e.preventDefault();
          }
        }}
        maxLength={11}
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

      {/* Email */}
      <input
        type="email"
        id="email"
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
  name="direccion_fake"
  id="direccion"
  inputmode="none"
  autocomplete="new-password"
  autocorrect="off"
  spellcheck={false}
  class={`w-full border px-3 py-2 rounded text-sm ${
    errores().direccion || errorDireccion() ? "border-red-500" : ""
  }`}
  placeholder="Dirección completa *"
  value={direccion()}
  onInput={(e) => {
    setDireccion(capitalizarTexto(e.currentTarget.value));
    setInputDireccion(e.currentTarget.value);
    setMostrarSugerencias(true);
    persistirDatos();
  }}
/>



      <Show when={errorDireccion()}>
        <p class="text-red-600 text-xs">Seleccioná una dirección válida con altura.</p>
      </Show>
      <Show when={errores().direccion}>
        <p class="text-red-600 text-xs">{errores().direccion}</p>
      </Show>

      <Show when={mostrarSugerencias() && sugerencias().length}>
        <ul class="border bg-white rounded text-sm max-h-40 overflow-y-auto">
          <For each={sugerencias()}>
  {(dir) => (
    <li
      class="p-2 hover:bg-gray-100 cursor-pointer"
      onClick={() => handleSelectDireccion(dir)}
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
        class="w-full border px-3 py-2 rounded text-sm bg-gray-100"
        placeholder="Código Postal"
        value={codigoPostal()}
        readOnly
      />

      {/* Razón Social */}
      <input
        type="text"
        id="razonSocial"
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
