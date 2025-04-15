import { createSignal, createResource, Show, For, createEffect } from 'solid-js';
import { obtenerProvincias, buscarLocalidades } from '../services/ubicacion.service';

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
  const [localidadTexto, setLocalidadTexto] = createSignal('');
  const [localidadId, setLocalidadId] = createSignal<number | undefined>();
  const [sugerencias, setSugerencias] = createSignal<any[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = createSignal(false);
  const [mensaje, setMensaje] = createSignal('');

  const [provincias] = createResource(obtenerProvincias);

  createEffect(async () => {
    if (provinciaId() && localidadTexto().length >= 2) {
      const resultados = await buscarLocalidades(localidadTexto(), provinciaId() || 0); // 0 si es undefined
      setSugerencias(resultados);
      setMostrarDropdown(true);
    } else {
      setSugerencias([]);
      setMostrarDropdown(false);
    }
  });

  const seleccionarLocalidad = (loc: any) => {
    setLocalidadTexto(loc.nombre);
    setLocalidadId(loc.id);
    setTimeout(() => setMostrarDropdown(false), 100);
  };

  const enviar = () => {
    if (!nombre() || !telefono() || !email() || !direccion() || !cuit() || !provinciaId() || !localidadId()) {
      setMensaje('Por favor completá todos los campos obligatorios.');
      return;
    }
  
    const vendedorRaw = localStorage.getItem("vendedor");
    const vendedorId = vendedorRaw ? JSON.parse(vendedorRaw).id : undefined;  
    const datosCliente = {
      nombre: nombre(),
      telefono: telefono(),
      email: email(),
      direccion: direccion(),
      razonSocial: razonSocial(),
      cuit_cuil: cuit(),
      provinciaId: provinciaId(),
      localidadId: localidadId(),
      vendedorId: Number(vendedorId),
    };
  
    setMensaje('');
    onConfirmar(datosCliente);
  };
  

  return (
    <div class="text-sm space-y-2 relative">
      <input class="w-full border px-3 py-2 rounded text-sm" type="text" placeholder="Nombre *" value={nombre()} onInput={(e) => setNombre(e.currentTarget.value)} />
      <input class="w-full border px-3 py-2 rounded text-sm" type="text" placeholder="Teléfono *" value={telefono()} onInput={(e) => setTelefono(e.currentTarget.value)} />
      <input class="w-full border px-3 py-2 rounded text-sm" type="email" placeholder="Email *" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
      <input class="w-full border px-3 py-2 rounded text-sm" type="text" placeholder="Dirección *" value={direccion()} onInput={(e) => setDireccion(e.currentTarget.value)} />
      <input class="w-full border px-3 py-2 rounded text-sm" type="text" placeholder="Razón social o Local (opcional)" value={razonSocial()} onInput={(e) => setRazonSocial(e.currentTarget.value)} />
      <input class="w-full border px-3 py-2 rounded text-sm" type="text" placeholder="CUIT / CUIL *" value={cuit()} onInput={(e) => setCuit(e.currentTarget.value)} />

      <select class="w-full border px-3 py-2 rounded text-sm" value={provinciaId() || ''} onChange={(e) => setProvinciaId(Number(e.currentTarget.value))}>
        <option value="">Seleccionar provincia *</option>
        <For each={provincias() || []}>
          {(prov: { id: number; nombre: string }) => (
            <option value={prov.id}>{prov.nombre}</option>
          )}
        </For>
      </select>

      <div class="relative">
        <input
          type="text"
          class="w-full border px-3 py-2 rounded text-sm"
          placeholder="Localidad *"
          value={localidadTexto()}
          onInput={(e) => {
            setLocalidadTexto(e.currentTarget.value);
            setLocalidadId(undefined);
          }}
          onFocus={() => setMostrarDropdown(true)}
        />
        <Show when={mostrarDropdown() && sugerencias().length > 0}>
          <ul class="absolute z-50 w-full bg-white border rounded mt-1 max-h-40 overflow-y-auto shadow text-sm">
            <For each={sugerencias()}>
              {(loc: { id: number; nombre: string }) => (
                <li class="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => seleccionarLocalidad(loc)}>
                  {loc.nombre}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>

      <Show when={mensaje()}>
        <p class="text-sm text-center text-red-600">{mensaje()}</p>
      </Show>

      <button class="w-full bg-black text-white py-2 rounded mt-2 text-sm" onClick={enviar}>
        Confirmar pedido
      </button>
    </div>
  );
}
