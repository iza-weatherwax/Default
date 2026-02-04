import Anthropic from '@anthropic-ai/sdk';
import type { AppSettings, ChatMessage } from '../types';
import { estimateTokens, calculateCost } from './tokenCounter';

/**
 * AI Service for interacting with Claude API
 */

export class AIService {
  private client: Anthropic | null = null;
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
    this.initializeClient();
  }

  private initializeClient(): void {
    if (!this.settings.apiKey) {
      console.warn('API key not set');
      return;
    }

    if (this.settings.apiProvider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: this.settings.apiKey,
        dangerouslyAllowBrowser: true,
      });
    } else if (this.settings.apiProvider === 'openrouter') {
      this.client = new Anthropic({
        apiKey: this.settings.apiKey,
        baseURL: this.settings.apiBaseUrl || 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Story Chat App',
        },
      });
    }
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings;
    this.initializeClient();
  }

  async generateResponse(
    messages: ChatMessage[],
    context: string,
    systemPrompt?: string
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    if (!this.client) {
      throw new Error('API client not initialized. Please set your API key in settings.');
    }

    // Build system message
    const systemMessage = this.buildSystemMessage(context, systemPrompt);

    // Convert messages to Claude format
    const claudeMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    try {
      const response = await this.client.messages.create({
        model: this.settings.modelName,
        max_tokens: this.settings.maxTokens,
        temperature: this.settings.temperature,
        system: systemMessage,
        messages: claudeMessages,
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      return {
        content,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AI API Error: ${error.message}`);
      }
      throw error;
    }
  }

  private buildSystemMessage(context: string, customPrompt?: string): string {
    let systemMessage = customPrompt || `Você é um assistente de escrita criativa especializado em ajudar autores a desenvolver suas histórias.

Seu papel:
- Ajudar a desenvolver a narrativa de forma coerente e envolvente
- Manter consistência com os personagens e o mundo estabelecido
- NUNCA violar as regras obrigatórias (locks)
- Evitar repetições desnecessárias
- Usar as informações do contexto para enriquecer a narrativa

Diretrizes:
- Seja criativo mas consistente
- Respeite as características estabelecidas dos personagens
- Mantenha o tom e estilo apropriados
- Evite repetir informações já mencionadas recentemente
- Use detalhes do contexto quando relevante`;

    if (context) {
      systemMessage += '\n\n' + context;
    }

    return systemMessage;
  }

  estimateTokensForRequest(
    messages: ChatMessage[],
    context: string
  ): number {
    const systemMessage = this.buildSystemMessage(context);
    const systemTokens = estimateTokens(systemMessage);

    const messageTokens = messages.reduce(
      (sum, msg) => sum + estimateTokens(msg.content),
      0
    );

    return systemTokens + messageTokens;
  }

  calculateRequestCost(
    inputTokens: number,
    outputTokens: number
  ): number {
    return calculateCost(inputTokens, outputTokens, this.settings.modelName);
  }
}

/**
 * Create a mock AI service for testing without API key
 */
export class MockAIService extends AIService {
  async generateResponse(
    messages: ChatMessage[],
    context: string
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastMessage = messages[messages.length - 1];

    const responses = [
      'O vento soprava forte enquanto Azael observava o horizonte. Seus olhos verdes brilhavam com determinação.',
      'A floresta estava silenciosa. Cada passo ecoava entre as árvores antigas.',
      'Ela sorriu, lembrando-se das palavras de sua mestra. "Nunca desista", ela havia dito.',
      'O castelo se erguia majestoso contra o céu crepuscular. Era hora de enfrentar seu destino.',
      'Com um suspiro, ele abriu o livro antigo. As páginas amareladas guardavam segredos há muito esquecidos.',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const inputTokens = estimateTokens(context + lastMessage.content);
    const outputTokens = estimateTokens(randomResponse);

    return {
      content: randomResponse,
      inputTokens,
      outputTokens,
    };
  }
}
