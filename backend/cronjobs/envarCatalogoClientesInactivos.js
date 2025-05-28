import cron from 'node-cron';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Cliente, Pedido, MensajeAutomatico } from '../models/index.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { formatearNumeroWhatsapp } from '../utils/formato.js';
import { obtenerClientesInactivos } from '../services/cliente.service.js';

// Flags para activar/desactivar tipos de envío
const HABILITAR_ENVIO_INACTIVOS = true;
const HABILITAR_ENVIO_RECORDATORIOS = true;
const HABILITAR_ENVIO_INTERESADOS = true;

// Miércoles a las 11:00 - primer mensaje
if (HABILITAR_ENVIO_INACTIVOS) {
  cron.schedule('0 11 * * 3', async () => {
    console.log('📅 Envío a clientes inactivos...');
    const clientes = await obtenerClientesInactivos();

    for (const cliente of clientes) {
      if (!cliente.telefono || cliente.seguimiento === false) continue;

      const yaTieneMensaje = await MensajeAutomatico.findOne({
        where: {
          clienteId: cliente.id,
          tipo: 'inactivo_inicial'
        }
      });
      if (yaTieneMensaje) continue;

      const nombre = cliente.nombre?.split(' ')[0];
      const variantes = [
        (n) => `${n}! Cómo venís con las ventas? Hace rato que no hacés pedidos. Tenemos novedades mayoristas y promos interesantes. Si querés te paso info.`,
        (n) => `Hola ${n}, como estás?.. tenemos nuevos productos y precios renovados en Marwal. Te paso el catálogo: www.catalogomarwal.online. ¿Querés que te recomiende algo?`,
        (n) => `${n}! Vimos que hace rato no pedís. Necesitás algo puntual? Te paso el link del catálogo por si querés mirar: www.catalogomarwal.online`,
        (n) => `Hola ${n}, qué bueno sería volver a trabajar juntos! Hay productos nuevos que están funcionando muy bien. Avisame si querés ver opciones.`
      ];

      const mensaje = variantes[Math.floor(Math.random() * variantes.length)](nombre);

      try {
        const tel = formatearNumeroWhatsapp(cliente.telefono);
        await enviarMensajeTextoLibreWhatsapp(tel, mensaje);
        await MensajeAutomatico.create({
          clienteId: cliente.id,
          tipo: 'inactivo_inicial',
          fechaEnvio: new Date(),
          estado: 'pendiente'
        });
        console.log(`✅ Enviado a ${tel}`);
      } catch (err) {
        console.error(`❌ Error enviando a ${cliente.telefono}:`, err.message);
      }
    }
  });
}

// Sábado - seguimiento
if (HABILITAR_ENVIO_RECORDATORIOS) {
  cron.schedule('0 11 * * 6', async () => {
    console.log('📅 Seguimiento a clientes inactivos...');
    const haceTresDias = dayjs().subtract(3, 'day').toDate();

    const mensajes = await MensajeAutomatico.findAll({
      where: {
        tipo: 'inactivo_inicial',
        fechaEnvio: { [Op.lte]: haceTresDias },
      },
      include: [{ model: Cliente, as: 'cliente' }],
    });

    for (const m of mensajes) {
      const cliente = m.cliente;
      if (!cliente || !cliente.telefono || cliente.seguimiento === false) continue;

      const yaTieneRecordatorio = await MensajeAutomatico.findOne({
        where: {
          clienteId: cliente.id,
          tipo: 'inactivo_recordatorio'
        }
      });
      if (yaTieneRecordatorio) continue;

      const nombre = cliente.nombre?.split(' ')[0] || 'Hola';
      const mensaje = `${nombre}! Pudiste ver el catálogo que te mandamos el otro día? Si necesitás ayuda avisame, hay opciones nuevas que están funcionando muy bien.`;

      try {
        const tel = formatearNumeroWhatsapp(cliente.telefono);
        await enviarMensajeTextoLibreWhatsapp(tel, mensaje);

        await MensajeAutomatico.create({
          clienteId: cliente.id,
          tipo: 'inactivo_recordatorio',
          fechaEnvio: new Date(),
          estado: 'pendiente'
        });

        console.log(`📩 Seguimiento enviado a ${tel}`);
      } catch (err) {
        console.error(`❌ Error enviando seguimiento a ${cliente.telefono}:`, err.message);
      }
    }
  });
}

// Lunes - recordatorio final
if (HABILITAR_ENVIO_INTERESADOS) {
  cron.schedule('0 10 * * 1', async () => {
    console.log('📅 Recordatorio final a interesados...');
    const cincoDiasAtras = dayjs().subtract(5, 'day').toDate();

    const interesados = await MensajeAutomatico.findAll({
      where: {
        tipo: 'inactivo_recordatorio',
        estado: 'interesado',
        fechaEnvio: { [Op.lte]: cincoDiasAtras }
      },
      include: [{ model: Cliente, as: 'cliente' }],
    });

    for (const m of interesados) {
      const cliente = m.cliente;
      if (!cliente || !cliente.telefono || cliente.seguimiento === false) continue;

      const hizoPedido = await Pedido.findOne({
        where: {
          clienteId: cliente.id,
          createdAt: { [Op.gt]: m.fechaEnvio }
        }
      });
      if (hizoPedido) continue;

      const nombre = cliente.nombre?.split(' ')[0] || 'Hola';
      const mensaje = `${nombre}! La otra vez me dijiste que ibas a mirar. ¿Querés que te mande algunas opciones que se están vendiendo mucho?`;

      try {
        const tel = formatearNumeroWhatsapp(cliente.telefono);
        await enviarMensajeTextoLibreWhatsapp(tel, mensaje);

        await MensajeAutomatico.update(
          { estado: 'respondido' },
          { where: { id: m.id } }
        );

        console.log(`📩 Mensaje final enviado a ${tel}`);
      } catch (err) {
        console.error(`❌ Error enviando mensaje final a ${cliente.telefono}:`, err.message);
      }
    }
  });
}
