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
//import Proveedores from "./pages/Proveedores";

// ⚡ Lazy load para páginas protegidas
const Categorias = lazy(() => import("./pages/Categorias"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const Inicio = lazy(() => import("./pages/Inicio"));
const Operarios = lazy(() => import("./pages/Operarios"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const Productos = lazy(() => import("./pages/Productos"));
const Piezas = lazy(() => import("./pages/Piezas"));
const MateriasPrimas = lazy(() => import("./pages/MateriasPrimas"));
const ProduccionDiaria = lazy(() => import("./pages/ProduccionDiaria"));
const ProduccionDiariaInyeccion = lazy(() => import("./pages/ProduccionDiariaInyeccion"));
const OrdenesDeTrabajo = lazy(() => import("./pages/OrdenesDeTrabajo"));
const ResumenProduccion = lazy(() => import("./pages/Graficos/ResumenProduccion"));
const ResumenVentas = lazy(() => import("./pages/Graficos/ResumenVentas"));
const Eficiencia = lazy(() => import("./pages/Graficos/Eficiencia"));
const Vendedores = lazy(() => import("./pages/Vendedores"));
const ConversacionesBot = lazy(() => import("./pages/ConversacionesBot"));
const Facturas = lazy(() => import("./pages/Facturas"));
const ProductosPedidosPendientes = lazy(() => import("./pages/ProductosPedidosPendientes"));
const ConfiguracionGeneral = lazy(() => import('./pages/Pagina/ConfiguracionGeneral'));
const InformeClientesDux = lazy(() => import('./pages/Informes/Ventas/InformeClientesDux'));
const InformeClientesUltimaCompra = lazy(() => import('./pages/Informes/Ventas/InformeClientesUltimaCompra'));


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
        path="/Proveedores"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Proveedores />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/MateriasPrimas"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <MateriasPrimas />
            </Layout>
          </ProtectedRoute>
        )}
      />

      {/* Producción */}
      <Route
        path="/Produccion/OrdenesDeTrabajo"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <OrdenesDeTrabajo />
            </Layout>
          </ProtectedRoute>
        )}
      />
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
              <ProduccionDiariaInyeccion />
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
        path="/Informes/Ventas/InformeClientesUltimaCompra"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <InformeClientesUltimaCompra />
            </Layout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/Informes/InformeClientesDux"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <InformeClientesDux />
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
        path="/BaseDatos/Clientes"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Clientes />
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

      <Route
        path="/BaseDatos/Inyeccion/Piezas"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <Piezas />
            </Layout>
          </ProtectedRoute>
        )}
      />
      {/* Página / Configuración general */}
      <Route
        path="/Pagina/configuracion-general"
        component={() => (
          <ProtectedRoute>
            <Layout>
              <ConfiguracionGeneral />
            </Layout>
          </ProtectedRoute>
        )}
      />



    </Router>
  ),
  document.getElementById("root") as HTMLElement
);
