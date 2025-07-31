import { createSignal } from 'solid-js';
import ConfiguracionSistemaPage from './ConfiguracionSistema';
import RolesUsuariosPage from './RolesUsuarios';
import EstadosPedidosPage from './EstadosPedidos';
import LogoPage from './Logo';
import BannersPage from './Banners';
import InyeccionPage from './Inyeccion';

export default function ConfiguracionGeneral() {
  const [tab, setTab] = createSignal<'sistema' | 'logo' | 'banners' | 'roles' | 'estados' | 'inyeccion'>('sistema');

  const tabs = [
    { id: 'sistema', label: 'Sistema' },
    { id: 'logo', label: 'Logo' },
    { id: 'banners', label: 'Banners' },
    { id: 'roles', label: 'Roles de usuario' },
    { id: 'estados', label: 'Estados de pedido' },
    { id: 'inyeccion', label: 'Inyección' },
  ];

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Configuración general</h1>

      <div class="flex gap-2 border-b mb-6">
        {tabs.map((t) => (
          <button
            onClick={() => setTab(t.id as any)}
            class={`px-4 py-2 text-sm border-b-2 transition-all font-medium ${
              tab() === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-blue-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab() === 'sistema' && <ConfiguracionSistemaPage />}
        {tab() === 'logo' && <LogoPage />}
        {tab() === 'banners' && <BannersPage />}
        {tab() === 'roles' && <RolesUsuariosPage />}
        {tab() === 'estados' && <EstadosPedidosPage />}
        {tab() === 'inyeccion' && <InyeccionPage />}
      </div>
    </div>
  );
}
