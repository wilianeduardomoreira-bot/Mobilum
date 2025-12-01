import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_INSTRUCTION = `
Você é o "Rudge Ramos AI", o assistente virtual inteligente do Hotel Rudge Ramos.
Seu objetivo é ajudar a equipe do hotel (recepcionistas, gerentes) com gestão operacional.

REGRAS DE COMPORTAMENTO:
1. Você tem acesso aos dados em tempo real do hotel (fornecidos no contexto). Use-os para responder.
2. Seja profissional, prestativo e direto.
3. Se perguntarem sobre reservas, verifique a disponibilidade nos dados fornecidos.
4. Se perguntarem sobre hóspedes, consulte a lista de quartos ocupados.
5. Se perguntarem sobre manutenção, liste as ocorrências ativas.
6. O hotel possui 60 suítes (1º andar: Standard, 2º andar: Luxo, 3º andar: Master).
7. Valores base (apenas referência, verifique o contexto se disponível): Standard R$250, Luxo R$400, Master R$750.

IMPORTANTE: Você não pode alterar o banco de dados diretamente. Para realizar check-ins ou fechar contas, instrua o usuário a ir para a aba "Suítes".
`;

export const sendMessageToGemini = async (message: string, contextData: string = ''): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Combine base instructions with real-time data
    const fullSystemInstruction = `
      ${BASE_INSTRUCTION}
      
      === DADOS EM TEMPO REAL DO HOTEL (${new Date().toLocaleString()}) ===
      ${contextData}
      ===============================================================
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: message,
      config: {
        systemInstruction: fullSystemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Erro ao comunicar com Gemini:", error);
    return "Ocorreu um erro ao conectar com o assistente inteligente. Verifique sua conexão ou chave de API.";
  }
};