import { createSignal, createEffect, Show, createResource, For, createMemo } from "solid-js";
import type { Usuario, PersonalDux } from "@/types/usuario";
import type { RolUsuario } from "@/types/rolUsuario";
import { obtenerPersonalDux } from "@/services/personalDux.service";
import { obtenerRolesUsuario } from "@/services/rolUsuario.service";

interface Props {
  abierto: boolean;
  cerrar: () => void;
  administrador: Usuario | null;
  onGuardar: (admin: Partial<Usuario>) => void;
}

export default function ModalNuevoAdministrador(props: Props) {
  const [nombre, setNombre] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [telefono, setTelefono] = createSignal("");

  // manejar SIEMPRE como string en el select
  const [personalDuxSel, setPersonalDuxSel] = createSignal<string>("");
  const [rolesSel, setRolesSel] = createSignal<string>("");

  const [personal] = createResource<PersonalDux[]>(obtenerPersonalDux);
  const [roles] = createResource<RolUsuario[]>(obtenerRolesUsuario);

  // opciones normalizadas
  const opciones = createMemo(() =>
    (personal() ?? []).map((p) => ({
      value: String(p.id),
      label: `${p.apellido_razon_social}, ${p.nombre}`,
    }))
  );

  const existeSeleccion = createMemo(() =>
    opciones().some((o) => o.value === personalDuxSel())
  );

  createEffect(() => {
    const a = props.administrador as any;
    if (a) {
      setNombre(a.nombre || "");
      setEmail(a.email || "");
      setTelefono(a.telefono || "");

      // prioriza FK directa, luego include; soporta include como objeto o array
      const preRaw =
        a.personalDuxId ??
        a.personalDux?.id ??
        (Array.isArray(a.personalDux) ? a.personalDux[0]?.id : undefined) ??
        "";

      setPersonalDuxSel(preRaw == null || preRaw === "" ? "" : String(preRaw));
    } else {
      setNombre("");
      setEmail("");
      setTelefono("");
      setPersonalDuxSel("");
    }
  });

  const handleSubmit = () => {
    if (!nombre() || !email()) return;

    props.onGuardar({
      nombre: nombre(),
      email: email(),
      telefono: telefono(),
      rolUsuarioId: 2, // Admin
      personalDuxId: personalDuxSel() === "" ? null : Number(personalDuxSel()),
    });
  };

  const labelSeleccionActual = createMemo(() => {
    const a = props.administrador as any;
    const id = personalDuxSel();
    if (!id) return "— Sin vínculo —";
    const ap = a?.personalDux?.apellido_razon_social || a?.personalDux?.[0]?.apellido_razon_social;
    const no = a?.personalDux?.nombre || a?.personalDux?.[0]?.nombre;
    return ap && no ? `${ap}, ${no}` : `Seleccionado (#${id})`;
  });

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={props.cerrar}>
        <div class="bg-white p-6 rounded-md w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h2 class="text-xl font-bold mb-4">
            {props.administrador ? "Editar Administrador" : "Nuevo Administrador"}
          </h2>

          <div class="space-y-3">
            <label class="block text-sm mb-1">Nombre y Apellido</label>
            <input
              type="text"
              placeholder="Nombre y Apellido *"
              class="w-full border p-2 rounded"
              value={nombre()}
              onInput={(e) => setNombre(e.currentTarget.value)}
            />
            <label class="block text-sm mb-1">Email</label>
            <input
              type="email"
              placeholder="Email *"
              class="w-full border p-2 rounded"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
            />
            <label class="block text-sm mb-1">Teléfono</label>
            <input
              type="tel"
              placeholder="Teléfono"
              class="w-full border p-2 rounded"
              value={telefono()}
              onInput={(e) => setTelefono(e.currentTarget.value)}
            />

            <div>
              <label class="block text-sm mb-1">Rol Usuario</label>
              <select
                class="w-full border p-2 rounded"
                value={rolesSel()}
                onChange={(e) => setRolesSel(e.currentTarget.value)}
              >
                <option value="{props.administrador?.rolUsuarioId}">{props.administrador?.rolUsuario?.nombre}</option>

                <For each={roles()}>
                  {(o) => (
                    <option value={o.id}>{o.nombre}</option>
                  )}
                </For>
              </select>
            </div>

            <div>
              <label class="block text-sm mb-1">Vincular a Personal Dux (opcional)</label>
              <select
                class="w-full border p-2 rounded"
                value={personalDuxSel()}
                onChange={(e) => setPersonalDuxSel(e.currentTarget.value)}
              >
                <option value="{props.administrador?.personalDuxId}">{props.administrador?.personalDux?.nombre} {props.administrador?.personalDux?.apellido_razon_social}</option>

                <For each={opciones()}>
                  {(o) => (
                    <option value={o.value}>{o.label}</option>
                  )}
                </For>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button class="bg-gray-300 px-4 py-1 rounded" onClick={props.cerrar}>
              Cancelar
            </button>
            <button class="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleSubmit}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
