export const generarPromptConversacional = (mensajeUsuario, productos, historial) => {
  let prompt = `Este es el nuevo mensaje del cliente: "${mensajeUsuario}".`;

  if (Array.isArray(historial) && historial.length > 0) {
    const ultimos = historial.reverse().map(h =>
      `🧍 Cliente: ${h.mensajeCliente}\n🤖 Bot: ${h.respuestaBot}`
    ).join('\n');
    prompt += `\nHistorial de conversación:\n${ultimos}`;
  }

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nSugerí alguno de estos productos sin listar todo directamente:\n${lista}`;
  } else {
    prompt += `\n\nNo hay coincidencias exactas, pero podés ofrecer otras categorías, preguntar más info o derivar con humano.`;
  }

  prompt += `\nRespondé con empatía, como humano.`;

  return prompt;
};
