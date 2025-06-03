import { responderDesdeOpenAI } from '@/services/chat.service';

export const responderPregunta = async (req, res) => {
  try {
    const { pregunta } = req.body;
    const { respuesta, acciones } = await responderDesdeOpenAI(pregunta);
    res.json({ respuesta, acciones });
  } catch (error) {
    console.error("❌ Error en chat.controller:", error);
    res.status(500).json({ mensaje: "Error al responder la pregunta." });
  }
};
