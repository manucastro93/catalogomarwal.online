import {
  createSignal,
  createResource,
  Show,
  For,
} from 'solid-js';
import { obtenerProvincias, obtenerLocalidades } from '../services/ubicacion.service';
import { capitalizarTexto } from '../utils/formato';

interface Props {
  onConfirmar: (datosCliente: any) => void;
}

export default function FormularioCliente({ onConfirmar }: Props) {
  const [nombre, setNombre] = createSignal('');
  const [telefono, setTelefono] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [direccion, setDireccion] = createSignal('');
  const [razonSocial, setRazonSocial] = createSignal('');
  const [cuit, setCuit] = createSignal('');
  const [provinciaId, setProvinciaId] = createSignal<number | undefined>();
  const [localidadId, setLocalidadId] = createSignal<number | undefined>();

  const [errores, setErrores] = createSignal<Record<string, string>>({});

  const [provincias] = createResource(obtenerProvincias);
  const [localidades, setLocalidades] = createSignal<any[]>([]);

  const cargarLocalidades = async (provId: number) => {
    const resultado = await obtenerLocalidades(provId);
    setLocalidades(resultado);
  };

  const enviar = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!nombre().trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    if (!telefono().trim()) nuevosErrores.telefono = 'El teléfono es obligatorio';
    if (!email().trim() || !email().includes('@')) nuevosErrores.email = 'El email no es válido';
    if (!direccion().trim()) nuevosErrores.direccion = 'La dirección es obligatoria';
    if (!cuit().trim()) nuevosErrores.cuit = 'El CUIT/CUIL es obligatorio';
    if (!provinciaId()) nuevosErrores.provincia = 'Seleccioná una provincia';
    if (!localidadId()) nuevosErrores.localidad = 'Seleccioná una localidad';

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
      provinciaId: provinciaId(),
      localidadId: localidadId(),
      vendedorId: Number(vendedorId),
    });
  };

  return (
    <div class="text-sm space-y-2">
      {/* Nombre */}
      <input
        class={`w-full border px-3 py-2 rounded text-sm ${errores().nombre ? 'border-red-500' : ''}`}
        type="text"
        placeholder="Nombre *"
        value={nombre()}
        onInput={(e) => setNombre(capitalizarTexto(e.currentTarget.value))}
      />
      <Show when={errores().nombre}>
        <p class="text-red-600 text-xs">{errores().nombre}</p>
      </Show>

      {/* Teléfono */}
      <input
        class={`w-full border px-3 py-2 rounded text-sm ${errores().telefono ? 'border-red-500' : ''}`}
        type="text"
        placeholder="Teléfono *"
        value={telefono()}
        onInput={(e) => setTelefono(e.currentTarget.value)}
      />
      <Show when={errores().telefono}>
        <p class="text-red-600 text-xs">{errores().telefono}</p>
      </Show>

      {/* Email */}
      <input
        class={`w-full border px-3 py-2 rounded text-sm ${errores().email ? 'border-red-500' : ''}`}
        type="email"
        placeholder="Email *"
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
      />
      <Show when={errores().email}>
        <p class="text-red-600 text-xs">{errores().email}</p>
      </Show>

      {/* Dirección */}
      <input
        class={`w-full border px-3 py-2 rounded text-sm ${errores().direccion ? 'border-red-500' : ''}`}
        type="text"
        placeholder="Dirección *"
        value={direccion()}
        onInput={(e) => setDireccion(capitalizarTexto(e.currentTarget.value))}
      />
      <Show when={errores().direccion}>
        <p class="text-red-600 text-xs">{errores().direccion}</p>
      </Show>

      {/* Razón social */}
      <input
        class="w-full border px-3 py-2 rounded text-sm"
        type="text"
        placeholder="Razón social o Local (opcional)"
        value={razonSocial()}
        onInput={(e) => setRazonSocial(capitalizarTexto(e.currentTarget.value))}
      />

      {/* CUIT / CUIL */}
      <input
        class={`w-full border px-3 py-2 rounded text-sm ${errores().cuit ? 'border-red-500' : ''}`}
        type="text"
        placeholder="CUIT / CUIL *"
        value={cuit()}
        onInput={(e) => setCuit(e.currentTarget.value)}
      />
      <Show when={errores().cuit}>
        <p class="text-red-600 text-xs">{errores().cuit}</p>
      </Show>

      {/* Provincia */}
      <select
        class={`w-full border px-3 py-2 rounded text-sm ${errores().provincia ? 'border-red-500' : ''}`}
        value={provinciaId() || ''}
        onChange={async (e) => {
          const id = Number(e.currentTarget.value);
          setProvinciaId(id);
          await cargarLocalidades(id);
        }}
      >
        <option value="">Seleccionar provincia *</option>
        <For each={provincias() || []}>
          {(prov: { id: number; nombre: string }) => (
            <option value={prov.id}>{prov.nombre}</option>
          )}
        </For>
      </select>
      <Show when={errores().provincia}>
        <p class="text-red-600 text-xs">{errores().provincia}</p>
      </Show>

      {/* Localidad */}
      <select
        class={`w-full border px-3 py-2 rounded text-sm ${errores().localidad ? 'border-red-500' : ''}`}
        value={localidadId() || ''}
        onChange={(e) => setLocalidadId(Number(e.currentTarget.value))}
      >
        <option value="">Seleccionar localidad *</option>
        <For each={localidades()}>
          {(loc: { id: number; nombre: string }) => (
            <option value={loc.id}>{loc.nombre}</option>
          )}
        </For>
      </select>
      <Show when={errores().localidad}>
        <p class="text-red-600 text-xs">{errores().localidad}</p>
      </Show>

      {/* Botón */}
      <button class="w-full bg-black text-white py-2 rounded mt-2 text-sm" onClick={enviar}>
        Confirmar pedido
      </button>
    </div>
  );
}
