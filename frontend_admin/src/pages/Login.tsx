import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { loginUsuario } from '@/services/auth.service';
import { useAuth } from '@/store/auth';

export default function Login() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    try {
      const { token, usuario, requiereContraseña } = await loginUsuario(email(), password());
      login(usuario, token);

      if (requiereContraseña) {
        navigate('/definir-contraseña');
      } else {
        navigate('/Inicio');
      }
    } catch (err) {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white px-4">
      <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <div class="flex justify-center mb-6">
          <img src="https://www.catalogomarwal.online/uploads/logo/logo-1744541371501.svg" alt="Logo de la empresa" class="h-16" />
        </div>
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar sesión</h1>
  
        {error() && (
          <p class="text-red-600 text-sm text-center mb-4">{error()}</p>
        )}
  
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
  
          <button
            type="submit"
            class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
  
}
