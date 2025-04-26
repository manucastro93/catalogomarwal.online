// 🔵 SolidJS imports
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import type { ParentProps } from "solid-js";

// 🎨 Styles
import "./index.css";

// 📄 Pages
import Inicio from "./pages/Inicio";
import Confirmacion from "./pages/Confirmacion";
import MisPedidos from "./pages/MisPedidos";
import SinAcceso from "./pages/SinAcceso";
import CapturaVendedor from "./pages/CapturaVendedor";
import DetalleProducto from "./pages/DetalleProducto";

// 🧩 Layout Components
import LayoutPublic from "@/components/Layout/LayoutPublic";
import Footer from "@/components/Layout/Footer";
import HeaderCarritoMobile from "@/components/Layout/HeaderCarritoMobile";

// 🛡️ Route Protection
import RutaProtegida from "@/components/Layout/RutaProtegida";

// 🗂️ Store
import { setCarrito } from "./store/carrito";

// 🔧 Configuraciones iniciales
window.scrollTo = () => {};

const guardado = localStorage.getItem("carrito");
if (guardado) {
  setCarrito(JSON.parse(guardado));
}

// 🔧 Mini componente para envolver rutas protegidas
const PublicLayout = (props: ParentProps) => (
  <RutaProtegida>
    <LayoutPublic>
      {props.children}
    </LayoutPublic>
  </RutaProtegida>
);

// 🚀 Renderizado principal
render(
  () => (
    <Router>
      {/* Públicas */}
      <Route path="/:vendedorLink" component={CapturaVendedor} />
      <Route path="/producto/:id" component={(props) => <DetalleProducto id={Number(props.params.id)} />} />

      {/* Protegidas */}
      <Route
        path="/"
        component={() => (
          <PublicLayout>
            <HeaderCarritoMobile />
            <Inicio />
          </PublicLayout>
        )}
      />
      <Route
        path="/editar/:id"
        component={(props) => (
          <PublicLayout>
            <HeaderCarritoMobile />
            <Inicio pedidoIdEdicion={props.params.id} />
          </PublicLayout>
        )}
      />
      <Route
        path="/confirmacion"
        component={() => (
          <PublicLayout>
            <Confirmacion />
          </PublicLayout>
        )}
      />
      <Route
        path="/mis-pedidos"
        component={() => (
          <PublicLayout>
            <MisPedidos />
          </PublicLayout>
        )}
      />
      <Route path="/sin-acceso" component={SinAcceso} />
      
      {/* Catch-all para 404 */}
      <Route path="*" component={SinAcceso} />
    </Router>
  ),
  document.getElementById("root")!
);
