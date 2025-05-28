export const generarPromptConversacional = (mensajeUsuario, productos, historial) => {
  let prompt = `🆕 Nuevo mensaje del cliente:\n"${mensajeUsuario}"`;

  // Historial reciente
  if (historial?.length > 0) {
    const ultimos = historial.reverse().map(h =>
      `🧍 Cliente: ${h.mensajeCliente}\n🤖 Bot: ${h.respuestaBot}`
    ).join('\n');

    prompt += `\n\n📜 Historial reciente:\n${ultimos}`;
    prompt += `\n\n❗ Revisá el historial antes de responder.`;
    prompt += ` No repitas saludos ni el link del catálogo si ya se enviaron, salvo que el cliente lo pida otra vez.`;
    prompt += ` Si ya le respondiste hace poco, evitá decir lo mismo con otras palabras.`;
  } else {
    prompt += `\n\n💡 Es el primer mensaje. Podés saludar si querés.`;
  }

  // Productos sugeridos
  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\n📦 Productos relacionados (no los listés todos literal, usalos como referencia):\n${lista}`;
  } else {
    prompt += `\n\n⚠️ No se encontraron productos exactos. Podés sugerir algo parecido, pedir más info o derivar si hace falta.`;
  }

  // Indicaciones generales
  prompt += `\n\n🧠 Respondé como vendedor mayorista de Marwal. Sé claro, empático, directo y resolutivo.`;
  prompt += ` Usá 'vos', 'mirá', 'acá te paso', 'cualquier cosa decime'.`;
  prompt += ` No uses expresiones como 'lo siento', 'soy un modelo de lenguaje' ni repitas lo que ya dijiste.`;
  prompt += ` Si pasás el catálogo, usá exactamente: "Acá te paso el catálogo: https://catalogomarwal.online/ZAGB".`;
  prompt += ` Nunca uses paréntesis ni corchetes. Frases cortas.`;

  return prompt;
};
