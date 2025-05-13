import { Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import ConPermiso from '@/components/Layout/ConPermiso';
import { Layers, ChevronDown, ChevronUp } from 'lucide-solid';

export default function Produccion(props: { usuario: any }) {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  const [metalmecOpen, setMetalmecOpen] = createSignal(false);

  const esActivo = (path: string) => location.pathname === path;

  if (props.usuario?.rolUsuarioId === 3) return null; // VENDEDOR
  console.log(props.usuario?.rolUsuarioId)
  return (
    <div>
      <button onClick={() => setOpen(!open())} class="flex items-center justify-between w-full px-2 py-1 hover:bg-gray-700 rounded">
        <span class="flex items-center gap-2"><Layers size={16} /> Producción</span>
        {open() ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <Show when={open()}>
        <div class="ml-10 flex flex-col gap-1 mt-1">
          <ConPermiso modulo="Operarios" accion="ver">
            <A href="/Produccion/Operarios" classList={{ 'text-blue-400': esActivo('/Produccion/Operarios') }}>Operarios</A>
          </ConPermiso>

          <button onClick={() => setMetalmecOpen(!metalmecOpen())} class="flex justify-between items-center">
            <span>Metalúrgica</span>
            {metalmecOpen() ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <Show when={metalmecOpen()}>
            <div class="ml-4 flex flex-col gap-1">
              <ConPermiso modulo="MetalurgicaProductos" accion="ver">
                <A href="/Metalurgica/Productos" classList={{ 'text-blue-400': esActivo('/Metalurgica/Productos') }}>Productos</A>
              </ConPermiso>
              <ConPermiso modulo="MetalurgicaConfiguracion" accion="ver">
                <A href="/Metalurgica/Configuracion" classList={{ 'text-blue-400': esActivo('/Metalurgica/Configuracion') }}>Configuración</A>
              </ConPermiso>
              <ConPermiso modulo="MetalurgicaRegistro" accion="ver">
                <A href="/Metalurgica/Registro" classList={{ 'text-blue-400': esActivo('/Metalurgica/Registro') }}>Registro de Producción Diaria</A>
              </ConPermiso>
            </div>
          </Show>

          <ConPermiso modulo="Inyeccion" accion="ver">
            <A href="/Produccion/Inyeccion" classList={{ 'text-blue-400': esActivo('/Produccion/Inyeccion') }}>Inyección</A>
          </ConPermiso>
          <ConPermiso modulo="Hojalateria" accion="ver">
            <A href="/Produccion/Hojalateria" classList={{ 'text-blue-400': esActivo('/Produccion/Hojalateria') }}>Hojalatería</A>
          </ConPermiso>
          <ConPermiso modulo="ProduccionDiaria" accion="ver">
            <A href="/Produccion/ProduccionDiaria" classList={{ 'text-blue-400': esActivo('/Produccion/ProduccionDiaria') }}>Producción Diaria</A>
          </ConPermiso>
        </div>
      </Show>
    </div>
  );
}
