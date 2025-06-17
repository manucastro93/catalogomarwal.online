import express from 'express';

  // Página
import {
  obtenerPaginaPublica,
  listarBanners,
} from '../controllers/public/paginaPublic.controller.js';
  // Vendedor
import {
  buscarVendedorPorLink
} from '../controllers/public/vendedorPublic.controller.js';
// 🧾 Cliente
import {
  obtenerClientePorIp,
  obtenerClientePorId,
  registrarLogPublico,
  obtenerClientePorTelefono,
} from '../controllers/public/clientePublic.controller.js';
// 📦 Pedido
import {
  crearOEditarPedido,
  obtenerPedidosClientePorId,
  obtenerPedidoPorId,
  marcarComoEditando,
  revertirEditando,
  validarCarritoSolo,
  duplicarPedido,
  cancelarPedidoDesdeCliente,
} from '../controllers/public/pedidoPublic.controller.js';
// 🛍 Producto
import {
  listarProductosPublicos,
  obtenerProductoPorId,
  listarCategorias,
} from '../controllers/public/productoPublic.controller.js';

// 📱 Validación WhatsApp
import { 
  enviarCodigoWhatsapp, 
  validarCodigoWhatsapp 
} from '../controllers/public/validacionWhatsapp.controller.js';

import { validarPedidoBody } from '../validaciones/pedido.validation.js';

const router = express.Router();

// 🧾 Cliente
router.get('/cliente-por-ip', obtenerClientePorIp);
router.post('/logs', registrarLogPublico);
router.get('/cliente/:id', obtenerClientePorId);
router.get('/cliente-por-telefono/:numero', obtenerClientePorTelefono);

//Validar whatsap
router.post('/validar-whatsapp/enviar', enviarCodigoWhatsapp);
router.post('/validar-whatsapp/verificar', validarCodigoWhatsapp);

// 📄 Página
router.get('/pagina', obtenerPaginaPublica);
router.get('/banners', listarBanners);

// 📦 Pedido
router.post('/pedidos', validarPedidoBody, crearOEditarPedido);
router.get('/pedidos/id-cliente', obtenerPedidosClientePorId);
router.get('/pedidos/:id', obtenerPedidoPorId);
router.put('/pedidos/:id/editando', marcarComoEditando);
router.put('/pedidos/:id/revertir-editando', revertirEditando);
router.post('/pedidos/validar', validarCarritoSolo);
router.post('/pedidos/duplicar', duplicarPedido);
router.put('/pedidos/:id/cancelar-desde-cliente', cancelarPedidoDesdeCliente);

// 🛍 Producto
router.get('/productos', listarProductosPublicos);
router.get('/productos/:id', obtenerProductoPorId);
router.get('/categorias', listarCategorias);

// 🧑‍💼 Vendedor
router.get('/usuarios/vendedores/vendedor-por-link/:link', buscarVendedorPorLink);

// 📍 Autocomplete con Google
router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({ message: 'Parámetro inválido' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&language=es&components=country:ar`;

    const response = await fetch(url);
    const data = await response.json();
    res.json({ predictions: data.predictions || [] });
  } catch (error) {
    console.error('❌ Error en /autocomplete:', error);
    res.status(500).json({ message: 'Error al consultar Google Places' });
  }
});

// 📍 Detalle de dirección por place_id
router.get('/direccion-detalle', async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id || typeof place_id !== 'string') {
      return res.status(400).json({ message: 'Parámetro place_id inválido' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}&language=es`;

    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== "OK" || !data.result) {
      console.error("❌ Google API ERROR:", data);
      return res.status(500).json({
        message: "Error desde Google API",
        status: data.status,
        detalle: data.error_message || "Respuesta inválida",
      });
    }

    const r = data.result;

    const getComp = (tipo) =>
      r.address_components?.find((c) => c.types.includes(tipo))?.long_name || "";

    res.json({
      formatted: r.formatted_address,
      components: {
        city: getComp("locality") || getComp("administrative_area_level_2"),
        state: getComp("administrative_area_level_1"),
        postcode: getComp("postal_code"),
        suburb: getComp("sublocality") || "",
        road: getComp("route"),
        house_number: getComp("street_number"),
      },
    });
  } catch (error) {
    console.error('❌ Error en /direccion-detalle:', error);
    res.status(500).json({ message: 'Error al obtener detalles de la dirección' });
  }
});

export default router;
