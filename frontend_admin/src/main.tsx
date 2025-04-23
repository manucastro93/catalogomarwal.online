import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import './index.css';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Categorias from './pages/Categorias';
import Vendedores from './pages/Vendedores';
import Administradores from './pages/Administradores';
import Pagina from './pages/Pagina';
import Estadisticas from './pages/Estadisticas';
import PedidoRapido from './pages/PedidoRapido';
import LogsCliente from './pages/LogsCliente';
import ProduccionDiaria from './pages/ProduccionDiaria';

import DefinirContrasena from './components/Usuario/DefinirContrasena';
import { checkLocalStorage, useAuth } from './store/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

// ✅ Restaurar sesión si existe
checkLocalStorage();

render(() => (
  <Router>
    <Route path="/" component={Login} />
    <Route path="/login" component={Login} />
    <Route path="/definir-contraseña" component={DefinirContrasena} />
    <Route path="/Inicio" component={() => <ProtectedRoute><Layout><Inicio /></Layout></ProtectedRoute>} />
    <Route path="/Productos" component={() => <ProtectedRoute><Layout><Productos /></Layout></ProtectedRoute>} />
    <Route path="/Clientes" component={() => <ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
    <Route path="/Pedidos" component={() => <ProtectedRoute><Layout><Pedidos /></Layout></ProtectedRoute>} />
    <Route path="/pedido-rapido" component={() => <ProtectedRoute><Layout><PedidoRapido /></Layout></ProtectedRoute>} />
    <Route path="/Categorias" component={() => <ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
    <Route path="/Vendedores" component={() => <ProtectedRoute><Layout><Vendedores /></Layout></ProtectedRoute>} />
    <Route path="/Administradores" component={() => <ProtectedRoute><Layout><Administradores /></Layout></ProtectedRoute>} />
    <Route path="/Pagina" component={() => <ProtectedRoute><Layout><Pagina /></Layout></ProtectedRoute>} />
    <Route path="/Estadisticas" component={() => <ProtectedRoute><Layout><Estadisticas /></Layout></ProtectedRoute>} />
    <Route path="/LogsCliente" component={() => <ProtectedRoute><Layout><LogsCliente /></Layout></ProtectedRoute>} />
    <Route path="/Produccion/ProduccionDiaria" component={() => <ProtectedRoute><Layout><ProduccionDiaria /></Layout></ProtectedRoute>} />
  </Router>
), document.getElementById('root') as HTMLElement);
