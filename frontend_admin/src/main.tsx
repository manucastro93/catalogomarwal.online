import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import './index.css';
import "flatpickr/dist/flatpickr.min.css";

import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Categorias from './pages/Categorias';
import Vendedores from './pages/Vendedores';
import Administradores from './pages/Administradores';
import Estadisticas from './pages/Estadisticas';
import PedidoRapido from './pages/PedidoRapido';
import LogsCliente from './pages/LogsCliente';
import ProduccionDiaria from './pages/ProduccionDiaria';
import Operarios from './pages/Operarios';
import ResumenProduccion from './pages/Graficos/ResumenProduccion'; 

import Logo from './pages/Pagina/Logo';
import Banners from './pages/Pagina/Banners';
import RolesUsuarios from './pages/Pagina/RolesUsuarios';
import EstadosPedidos from './pages/Pagina/EstadosPedidos';

import DefinirContrasena from './components/Usuario/DefinirContrasena';
import { checkLocalStorage } from './store/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

// ✅ Restaurar sesión si existe
checkLocalStorage();

render(() => (
  <Router>
    <Route path="/" component={Login} />
    <Route path="/login" component={Login} />
    <Route path="/definir-contraseña" component={DefinirContrasena} />

    {/* Rutas protegidas */}
    <Route path="/Inicio" component={() => <ProtectedRoute><Layout><Inicio /></Layout></ProtectedRoute>} />
    <Route path="/Productos" component={() => <ProtectedRoute><Layout><Productos /></Layout></ProtectedRoute>} />
    <Route path="/Clientes" component={() => <ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
    <Route path="/Pedidos" component={() => <ProtectedRoute><Layout><Pedidos /></Layout></ProtectedRoute>} />
    <Route path="/pedido-rapido" component={() => <ProtectedRoute><Layout><PedidoRapido /></Layout></ProtectedRoute>} />
    <Route path="/Categorias" component={() => <ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
    <Route path="/Vendedores" component={() => <ProtectedRoute><Layout><Vendedores /></Layout></ProtectedRoute>} />
    <Route path="/Administradores" component={() => <ProtectedRoute><Layout><Administradores /></Layout></ProtectedRoute>} />
    <Route path="/Estadisticas" component={() => <ProtectedRoute><Layout><Estadisticas /></Layout></ProtectedRoute>} />
    <Route path="/LogsCliente" component={() => <ProtectedRoute><Layout><LogsCliente /></Layout></ProtectedRoute>} />
    <Route path="Produccion/Operarios" component={() => <ProtectedRoute><Layout><Operarios /></Layout></ProtectedRoute>} />
    <Route path="/Produccion/ProduccionDiaria" component={() => <ProtectedRoute><Layout><ProduccionDiaria /></Layout></ProtectedRoute>} />
    <Route path="/Graficos/ResumenProduccion" component={() => <ProtectedRoute><Layout><ResumenProduccion /></Layout></ProtectedRoute>} />
    {/* Rutas separadas para Página */}
    <Route path="/Pagina/logo" component={() => <ProtectedRoute><Layout><Logo /></Layout></ProtectedRoute>} />
    <Route path="/Pagina/banners" component={() => <ProtectedRoute><Layout><Banners /></Layout></ProtectedRoute>} />
    <Route path="/Pagina/roles-usuarios" component={() => <ProtectedRoute><Layout><RolesUsuarios /></Layout></ProtectedRoute>} />
    <Route path="/Pagina/estados-pedidos" component={() => <ProtectedRoute><Layout><EstadosPedidos /></Layout></ProtectedRoute>} />
  </Router>
), document.getElementById('root') as HTMLElement);
