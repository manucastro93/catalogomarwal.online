import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import api from '../services/api';
import { useAuth } from '../store/auth';

export default function DefinirContrasena() {
  const [contraseña, setContraseña] = createSignal('');
  const [confirmacion, setConfirmacion] = createSignal('');
  const [error, setError] = createSignal('');
  const navigate = useNavigate();
  const { usuario, token, login } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (contraseña().trim().length < 4) {
      return setError('La contraseña debe tener al menos 4 caracteres');
    }

    if (contraseña() !== confirmacion()) {
      return setError('Las contraseñas no coinciden');
    }

    const user = usuario();
    if (!user) {
      return setError('Sesión no válida');
    }

    try {
      const { data } = await api.put(`/usuarios/${user.id}`, {
        contraseña: contraseña().trim(),
      });

      // Volvemos a guardar usuario actualizado en el contexto
      login(data, token() || '');
      navigate('/Inicio');
    } catch (err) {
      console.error(err);
      setError('Error al guardar contraseña');
    }
  };

  return (
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <form class="bg-white p-6 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
        <h1 class="text-2xl font-bold mb-4">Definir contraseña</h1>

        {error() && <p class="text-red-600 mb-2">{error()}</p>}

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={contraseña()}
          onInput={(e) => setContraseña(e.currentTarget.value)}
          class="w-full border p-2 rounded mb-3"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmacion()}
          onInput={(e) => setConfirmacion(e.currentTarget.value)}
          class="w-full border p-2 rounded mb-3"
        />

        <button type="submit" class="w-full bg-black text-white p-2 rounded">
          Guardar contraseña
        </button>
      </form>
    </div>
  );
}
