import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, PRODUCTS } from '../constants';

const apiKey = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    // Initialize with API Key from environment
    this.ai = new GoogleGenAI({ apiKey });
  }

  public async startChat(): Promise<void> {
    try {
      // Prepare context about products for the AI
      const productContext = PRODUCTS.map(p => 
        `- ${p.name} (${p.category}): R$ ${p.price.toFixed(2)}. Detalhes: ${p.description}`
      ).join('\n');

      const fullSystemInstruction = `${SYSTEM_INSTRUCTION}\n\nCatálogo Atual:\n${productContext}`;

      this.chatSession = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: fullSystemInstruction,
        },
      });
    } catch (error) {
      console.error("Failed to start chat session", error);
    }
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) {
      await this.startChat();
    }

    if (!this.chatSession) {
      return "Desculpe, estou tendo problemas para me conectar ao servidor de estilo no momento.";
    }

    try {
      const response: GenerateContentResponse = await this.chatSession.sendMessage({
        message: message
      });
      return response.text || "Não consegui entender, pode reformular?";
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      return "Ocorreu um erro momentâneo. Por favor, tente novamente.";
    }
  }
}

export const geminiService = new GeminiService();