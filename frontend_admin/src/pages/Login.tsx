import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { loginUsuario } from '../services/auth.service';
import { useAuth } from '../store/auth';

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
      const { token, usuario } = await loginUsuario(email(), password());
      login(usuario, token);
      navigate('/Inicio');
    } catch (err) {
      setError('Email o contraseña incorrectos');
    }
  };

  return (
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <form class="bg-white p-6 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit}>
        <h1 class="text-2xl font-bold mb-4">Iniciar sesión</h1>

        {error() && <p class="text-red-600 mb-2">{error()}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email()}
          onInput={(e) => setEmail(e.currentTarget.value)}
          class="w-full border p-2 rounded mb-3"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          class="w-full border p-2 rounded mb-3"
        />

        <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded">
          Ingresar
        </button>
      </form>
    </div>
  );
}
