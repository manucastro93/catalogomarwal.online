export const generarPromptConversacional = (mensajeUsuario, productos, historial) => {
  let prompt = `🆕 Nuevo mensaje del cliente:\n"${mensajeUsuario}"`;

  if (historial?.length > 0) {
    const ultimos = historial.reverse().map(h =>
      `🧍 Cliente: ${h.mensajeCliente}\n🤖 Bot: ${h.respuestaBot}`
    ).join('\n');

    prompt += `\n\n📜 Historial reciente:\n${ultimos}`;
    prompt += `\n❗ Importante: evitá repetir el saludo o el link del catálogo si ya se enviaron antes en el historial, salvo que el cliente lo pida de nuevo.`;
  }
    prompt += `\n⚠️ Si ya saludaste antes, no lo repitas. Solo saludá si es el primer mensaje del día.`;

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\n📦 Productos relacionados (no los listés todos literal, usalos como referencia):\n${lista}`;
  } else {
    prompt += `\n\n⚠️ No se encontraron productos exactos. Podés sugerir algo parecido, pedir más info o derivar si hace falta.`;
  }

  prompt += `\n\n🧠 Respondé como vendedor mayorista de Marwal. Sé claro, empático, directo y resolutivo. Usá 'vos', 'mirá', 'acá te paso', etc. Nunca respondas como robot. Frases cortas. Si vas a pasar el link del catálogo, ponelo así: "Acá te paso el catálogo: https://catalogomarwal.online/ZAGB". No uses corchetes ni paréntesis.`;

  return prompt;
};
