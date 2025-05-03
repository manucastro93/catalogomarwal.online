import api from "./api";

export async function preguntarAlAsistente(
    pregunta: string
  ): Promise<{ respuesta: string; acciones?: { texto: string; url: string }[] }> {
    const { data } = await api.post("/chat", { pregunta });
    return data;
  }
  
