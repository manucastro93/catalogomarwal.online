import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import "./index.css";

import Inicio from "./pages/Inicio";
import Confirmacion from "./pages/Confirmacion";
import MisPedidos from "./pages/MisPedidos";
import SinAcceso from "./pages/SinAcceso";
import CapturaVendedor from "./pages/CapturaVendedor";
import DetalleProducto from "./pages/DetalleProducto";

import LayoutPublic from "./components/LayoutPublic";
import RutaProtegida from "./components/RutaProtegida";

import { setCarrito } from "./store/carrito";
import Footer from "components/Footer";
import HeaderCarritoMobile from "./components/HeaderCarritoMobile";

window.scrollTo = () => {};

const guardado = localStorage.getItem("carrito");
if (guardado) {
  setCarrito(JSON.parse(guardado));
}

render(
  () => (
    <Router>
      <Route path="/:vendedorLink" component={CapturaVendedor} />

      {/* Adaptación para pasar params a DetalleProducto */}
      <Route
        path="/producto/:id"
        component={(props) => <DetalleProducto id={Number(props.params.id)} />}
      />
      <Route
  path="/editar/:id"
  component={(props) => (
    <RutaProtegida>
      <LayoutPublic>
        <HeaderCarritoMobile />
        <Inicio pedidoIdEdicion={props.params.id} />
      </LayoutPublic>
    </RutaProtegida>
  )}
/>


      <Route
        path="/"
        component={() => (
          <RutaProtegida>
            <LayoutPublic>
              <HeaderCarritoMobile />
              <Inicio />
            </LayoutPublic>
          </RutaProtegida>
        )}
      />

      <Route
        path="/confirmacion"
        component={() => (
          <RutaProtegida>
            <LayoutPublic>
              <Confirmacion />
            </LayoutPublic>
          </RutaProtegida>
        )}
      />

      <Route
        path="/mis-pedidos"
        component={() => (
          <RutaProtegida>
            <LayoutPublic>
              <MisPedidos />
            </LayoutPublic>
          </RutaProtegida>
        )}
      />

      <Route path="/sin-acceso" component={SinAcceso} />
    </Router>
  ),
  document.getElementById("root")!
);
