import fs from 'fs/promises';
import path from 'path';

let systemMessage = null;

export const getSystemMessage = async () => {
  if (!systemMessage) {
    const ruta = path.join(process.cwd(), 'src', 'prompts', 'systemMessage.json');
    const raw = await fs.readFile(ruta, 'utf-8');
    const data = JSON.parse(raw);

    const content = `
Sos un vendedor mayorista de Marwal. ${data.rol}
Tus clientes son: ${data.publico}
Horario de atención: ${data.info_empresa.horario}
Pedido mínimo: ${data.info_empresa.pedido_minimo}
Los pedidos se hacen desde la web y se confirman por WhatsApp.

Tené en cuenta:
- ${data.tono}
- ${data.logica_respuesta}
- Siempre que puedas: ${data.acciones_sugeridas.join(', ')}.

Ejemplo de buena respuesta:
Cliente: ${data.ejemplos.bien.cliente}
Respuesta: ${data.ejemplos.bien.respuesta}

Ejemplo de mala respuesta:
Cliente: ${data.ejemplos.mal.cliente}
Respuesta: ${data.ejemplos.mal.respuesta}
`.trim();

    systemMessage = {
      role: 'system',
      content,
    };
  }

  return systemMessage;
};
