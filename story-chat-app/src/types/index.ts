// Memory Bank Types
export interface Memory {
  id?: number;
  text: string;
  keywords: string[];
  importance: 1 | 2 | 3 | 4; // 1 = critical, 4 = background
  category: 'character' | 'world' | 'event' | 'relationship';
  lastUsed: Date | null;
  usageCount: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Character Lock Types
export interface CharacterLock {
  id?: number;
  characterName: string;
  rule: string;
  detectionPattern: string; // regex pattern
  prohibitedWords: string[];
  autoCorrect: boolean;
  violationAction: 'regenerate' | 'warn' | 'auto-fix';
  createdAt: Date;
  updatedAt: Date;
}

// Scene State Types
export interface MentionTracker {
  text: string;
  count: number;
  paragraphs: number[];
  lastMentioned: number;
}

export interface SceneState {
  id?: number;
  sessionId: string;
  charactersPresent: string[];
  location: string;
  mentions: MentionTracker[];
  currentParagraph: number;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Message Types
export interface ChatMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens: number;
  cost: number;
  timestamp: Date;
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    memories?: number[];
    locks?: number[];
    validationPassed?: boolean;
    violations?: string[];
  };
}

// Session Types
export interface Session {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  totalTokens: number;
  totalCost: number;
  messageCount: number;
}

// Settings Types
export interface AppSettings {
  id?: number;
  temperature: number;
  maxTokens: number;
  tokenBudget: number;
  apiKey: string;
  apiProvider: 'anthropic' | 'openrouter' | 'local';
  apiBaseUrl?: string;
  modelName: string;
  enableSemanticSearch: boolean;
  enableAutoCorrection: boolean;
  enableDuplicationCheck: boolean;
  embeddingModel: string;
  updatedAt: Date;
}

// Validation Result Types
export interface ValidationResult {
  passed: boolean;
  violations: {
    type: 'lock' | 'duplication' | 'consistency';
    description: string;
    severity: 'critical' | 'warning' | 'info';
    lockId?: number;
    suggestion?: string;
  }[];
}

// Context Selection Types
export interface ContextItem {
  memory: Memory;
  relevanceScore: number;
  priority: number;
}

export interface SelectedContext {
  locks: CharacterLock[];
  memories: ContextItem[];
  totalTokens: number;
  budgetUsed: number;
}

// Embedding Types
export interface EmbeddingCache {
  id?: number;
  text: string;
  embedding: number[];
  model: string;
  createdAt: Date;
}

// Token Usage Types
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
}

// AI Response Types
export interface AIResponse {
  content: string;
  usage: TokenUsage;
  validation: ValidationResult;
  memories: number[];
  locks: number[];
}
