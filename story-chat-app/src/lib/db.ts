import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  Memory,
  CharacterLock,
  SceneState,
  ChatMessage,
  Session,
  AppSettings,
  EmbeddingCache,
} from '../types';

export class StoryDatabase extends Dexie {
  memories!: Table<Memory, number>;
  locks!: Table<CharacterLock, number>;
  scenes!: Table<SceneState, number>;
  messages!: Table<ChatMessage, number>;
  sessions!: Table<Session, number>;
  settings!: Table<AppSettings, number>;
  embeddings!: Table<EmbeddingCache, number>;

  constructor() {
    super('StoryDatabase');

    this.version(1).stores({
      memories: '++id, importance, category, lastUsed, usageCount, createdAt',
      locks: '++id, characterName, createdAt',
      scenes: '++id, sessionId, createdAt',
      messages: '++id, sessionId, role, timestamp',
      sessions: '++id, createdAt, updatedAt',
      settings: '++id',
      embeddings: '++id, text, model, createdAt',
    });
  }

  async initializeDefaultSettings(): Promise<void> {
    const existingSettings = await this.settings.toArray();

    if (existingSettings.length === 0) {
      await this.settings.add({
        temperature: 0.7,
        maxTokens: 1000,
        tokenBudget: 5000,
        apiKey: '',
        apiProvider: 'anthropic',
        apiBaseUrl: 'https://api.anthropic.com',
        modelName: 'claude-3-5-sonnet-20241022',
        enableSemanticSearch: true,
        enableAutoCorrection: true,
        enableDuplicationCheck: true,
        embeddingModel: 'transformers.js',
        systemPrompt: '',
        updatedAt: new Date(),
      });
    }
  }

  async getOrCreateSession(name: string = 'Nova História'): Promise<Session> {
    const sessions = await this.sessions.toArray();

    if (sessions.length === 0) {
      const sessionId = await this.sessions.add({
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
      });

      const session = await this.sessions.get(sessionId);
      return session!;
    }

    return sessions[sessions.length - 1];
  }

  async clearAllData(): Promise<void> {
    await this.memories.clear();
    await this.locks.clear();
    await this.scenes.clear();
    await this.messages.clear();
    await this.sessions.clear();
    await this.embeddings.clear();
  }
}

export const db = new StoryDatabase();

// Initialize default settings on first load
db.on('ready', () => {
  return db.initializeDefaultSettings();
});
