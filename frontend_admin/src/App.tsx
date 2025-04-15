import { Route } from '@solidjs/router';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Categorias from './pages/Categorias';
import Vendedores from './pages/Vendedores';
import Administradores from './pages/Administradores';
import Pagina from './pages/Pagina';
import Estadisticas from './pages/Estadisticas';

function Layout(props: { children: any }) {
  return (
    <ProtectedRoute>
      <div class="flex">
        <Sidebar />
        <div class="flex-1">
          <Header />
          <main class="p-4">
            {props.children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <Route path="/" component={() => <Layout><Inicio /></Layout>} />
      <Route path="/Inicio" component={() => <Layout><Inicio /></Layout>} />
      <Route path="/Productos" component={() => <Layout><Productos /></Layout>} />
      <Route path="/Clientes" component={() => <Layout><Clientes /></Layout>} />
      <Route path="/Pedidos" component={() => <Layout><Pedidos /></Layout>} />
      <Route path="/Categorias" component={() => <Layout><Categorias /></Layout>} />
      <Route path="/Vendedores" component={() => <Layout><Vendedores /></Layout>} />
      <Route path="/Administradores" component={() => <Layout><Administradores /></Layout>} />
      <Route path="/Pagina" component={() => <Layout><Pagina /></Layout>} />
      <Route path="/Estadisticas" component={() => <Layout><Estadisticas /></Layout>} />
    </>
  );
}
