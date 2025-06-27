// 🔵 Librerías externas
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";

// 🎨 Estilos
import "flatpickr/dist/flatpickr.min.css";
import "./index.css";
import "@fontsource/inter";

// 📄 Páginas esenciales (login)
import Login from "./pages/Login";
import DefinirContrasena from "./components/Usuario/DefinirContrasena";

// 🧩 Componentes
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// 🛠️ Funciones / Store
import { checkLocalStorage } from "./store/auth";

// ⚡ Lazy load para páginas protegidas
const Administradores = lazy(() => import("./pages/Administradores"));
const Banners = lazy(() => import("./pages/Pagina/Banners"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Estadisticas = lazy(() => import("./pages/Estadisticas"));
const Inicio = lazy(() => import("./pages/Inicio"));
const LogsCliente = lazy(() => import("./pages/LogsCliente"));
const Operarios = lazy(() => import("./pages/Operarios"));
const PedidoRapido = lazy(() => import("./pages/PedidoRapido"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Productos = lazy(() => import("./pages/Productos"));
const ProductosProveedores = lazy(() => import("./pages/ProductosProveedores"));
const ProduccionDiaria = lazy(() => import("./pages/ProduccionDiaria"));
const ResumenProduccion = lazy(
  () => import("./pages/Graficos/ResumenProduccion")
);
const ResumenVentas = lazy(() => import("./pages/Graficos/ResumenVentas"));
const Eficiencia = lazy(() => import("./pages/Graficos/Eficiencia"));
const RolesUsuarios = lazy(() => import("./pages/Pagina/RolesUsuarios"));
const EstadosPedidos = lazy(() => import("./pages/Pagina/EstadosPedidos"));
const Logo = lazy(() => import("./pages/Pagina/Logo"));
const Vendedores = lazy(() => import("./pages/Vendedores"));
const ConversacionesBot = lazy(() => import("./pages/ConversacionesBot"));
const Facturas = lazy(() => import("./pages/Facturas"));
const ProductosPedidosPendientes = lazy(() => import("./pages/ProductosPedidosPendientes"));

// ✅ Restaurar sesión si existe
checkLocalStorage();

render(
  () => (
    <Router>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/definir-contraseña" component={DefinirContrasena} />

      {/* Rutas protegidas */}
      <Route
        path="/Inicio"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Inicio />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Ventas */}
      <Route
        path="/Pedidos"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Pedidos />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Facturas"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Facturas />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/ServicioComercial"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Eficiencia />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Stock"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenVentas />
            </Layout>
          </ProtectedRoute>
        )}
      />

    {/* Compras */}
      <Route
        path="/ProductosProveedores"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ProductosProveedores />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Producción */}
      <Route
        path="/Produccion/ProduccionDiaria"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ProduccionDiaria />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Produccion/Metalurgica"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Produccion/Inyeccion"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Produccion/Hojalateria"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Produccion/Operarios"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Operarios />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Informes */}
      <Route
        path="/Informes/ProduccionDiaria"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/Metalurgica"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/Inyeccion"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/Hojalateria"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenProduccion />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/ProductosPedidosPendientes"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ProductosPedidosPendientes />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/Ventas"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ResumenVentas />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Bot */}
      <Route
        path="/Bot/ConversacionesBot"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ConversacionesBot />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Base de datos */}
      <Route
        path="/BaseDatos/Productos"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Productos />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/BaseDatos/Categorias"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Categorias />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/BaseDatos/Vendedores"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Vendedores />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/BaseDatos/Operarios"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Operarios />
            </Layout>
          </ProtectedRoute>
        )}
      />
     
      {/* Página / Configuración general */}
      <Route
        path="/Pagina/logo"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Logo />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Pagina/banners"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Banners />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Pagina/roles-usuarios"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <RolesUsuarios />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Pagina/estados-pedidos"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <EstadosPedidos />
            </Layout>
          </ProtectedRoute>
        )}
      />
    </Router>
  ),
  document.getElementById("root") as HTMLElement
);
