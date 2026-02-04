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
    const isCustomProxy = this.isCustomProxy();
    const apiKey = isCustomProxy && !this.settings.apiKey
      ? 'sk-dummy'
      : this.settings.apiKey;

    if (!apiKey) {
      console.warn('API key not set');
      return;
    }

    const baseURL = this.getBaseURL();
    const defaultHeaders: Record<string, string> = {
      'anthropic-version': '2023-06-01',
    };

    // Add provider-specific headers
    if (this.settings.apiProvider === 'openrouter') {
      defaultHeaders['HTTP-Referer'] = window.location.origin;
      defaultHeaders['X-Title'] = 'Story Chat App';
    }

    this.client = new Anthropic({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
      defaultHeaders,
    });
  }

  private getBaseURL(): string {
    const baseUrl = this.settings.apiBaseUrl || 'https://api.anthropic.com';

    // Ensure URL ends with /v1 for Anthropic-compatible APIs
    if (baseUrl.includes('anthropic.com')) {
      return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
    }

    if (baseUrl.includes('openrouter')) {
      return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
    }

    // For custom proxies, assume they handle the /v1/messages path
    return baseUrl;
  }

  private isCustomProxy(): boolean {
    const baseUrl = this.settings.apiBaseUrl || '';
    return !baseUrl.includes('anthropic.com') &&
           !baseUrl.includes('openrouter') &&
           (baseUrl.includes('localhost') ||
            baseUrl.includes('127.0.0.1') ||
            baseUrl.startsWith('http://'));
  }

  isUsingCustomProxy(): boolean {
    return this.isCustomProxy();
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

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();

    try {
      if (!this.client) {
        return {
          success: false,
          message: 'Cliente não inicializado. Configure a API key primeiro.',
        };
      }

      // Send a minimal test message
      const response = await this.client.messages.create({
        model: this.settings.modelName,
        max_tokens: 10,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
      });

      const latency = Date.now() - startTime;

      if (response.content && response.content.length > 0) {
        return {
          success: true,
          message: `Conexão bem-sucedida! Latência: ${latency}ms`,
          latency,
        };
      }

      return {
        success: false,
        message: 'Resposta inesperada da API',
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      return {
        success: false,
        message: `Erro na conexão: ${errorMessage}`,
        latency,
      };
    }
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
