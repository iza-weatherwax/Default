import { create } from 'zustand';
import { db } from '../lib/db';
import type {
  Memory,
  CharacterLock,
  SceneState,
  ChatMessage,
  Session,
  AppSettings,
} from '../types';
import { AIService, MockAIService } from '../lib/aiService';
import { selectContext, buildContextString } from '../lib/contextSelection';
import {
  validateLocks,
  checkDuplication,
  combineValidations,
  updateSceneMentions,
} from '../lib/validation';
import { calculateCost } from '../lib/tokenCounter';

interface AppState {
  // Data
  currentSession: Session | null;
  memories: Memory[];
  locks: CharacterLock[];
  messages: ChatMessage[];
  sceneState: SceneState | null;
  settings: AppSettings | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  currentView: 'chat' | 'memories' | 'locks' | 'settings';
  tokenUsage: {
    current: number;
    budget: number;
    cost: number;
  };

  // AI Service
  aiService: AIService | null;

  // Actions
  initialize: () => Promise<void>;
  loadSession: (sessionId: number) => Promise<void>;
  createSession: (name: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;

  // Memory actions
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'usageCount'>) => Promise<void>;
  updateMemory: (id: number, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: number) => Promise<void>;
  loadMemories: () => Promise<void>;

  // Lock actions
  addLock: (lock: Omit<CharacterLock, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLock: (id: number, updates: Partial<CharacterLock>) => Promise<void>;
  deleteLock: (id: number) => Promise<void>;
  loadLocks: () => Promise<void>;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; message: string; latency?: number }>;

  // UI actions
  setView: (view: AppState['currentView']) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentSession: null,
  memories: [],
  locks: [],
  messages: [],
  sceneState: null,
  settings: null,
  isLoading: false,
  error: null,
  currentView: 'chat',
  tokenUsage: {
    current: 0,
    budget: 5000,
    cost: 0,
  },
  aiService: null,

  // Initialize
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().loadSettings();
      const session = await db.getOrCreateSession();
      await get().loadSession(session.id!);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Initialization failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Load session
  loadSession: async (sessionId: number) => {
    set({ isLoading: true, error: null });
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      const messages = await db.messages
        .where('sessionId')
        .equals(String(sessionId))
        .toArray();

      const sceneState = await db.scenes
        .where('sessionId')
        .equals(String(sessionId))
        .first();

      await get().loadMemories();
      await get().loadLocks();

      set({
        currentSession: session,
        messages,
        sceneState: sceneState || null,
        tokenUsage: {
          current: session.totalTokens,
          budget: get().settings?.tokenBudget || 5000,
          cost: session.totalCost,
        },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load session' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Create new session
  createSession: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const sessionId = await db.sessions.add({
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
      });

      await get().loadSession(sessionId);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create session' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Send message
  sendMessage: async (content: string) => {
    const state = get();
    if (!state.currentSession || !state.settings) {
      set({ error: 'No active session or settings' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const sessionId = String(state.currentSession.id!);

      // Create user message
      const userMessage: ChatMessage = {
        sessionId,
        role: 'user',
        content,
        tokens: 0,
        cost: 0,
        timestamp: new Date(),
      };

      await db.messages.add(userMessage);

      // Get or create AI service
      let aiService = state.aiService;
      if (!aiService || !state.settings.apiKey) {
        aiService = state.settings.apiKey
          ? new AIService(state.settings)
          : new MockAIService(state.settings);
        set({ aiService });
      }

      // Select context
      const context = await selectContext(
        content,
        state.memories,
        state.locks,
        state.settings.tokenBudget
      );

      const contextString = buildContextString(context);

      // Generate response
      const response = await aiService.generateResponse(
        [...state.messages, userMessage],
        contextString,
        state.settings.systemPrompt || undefined
      );

      // Validate response
      const lockValidation = validateLocks(response.content, state.locks);
      const duplicationValidation = checkDuplication(
        response.content,
        state.sceneState,
        (state.messages.length / 2) + 1
      );

      const validation = combineValidations(lockValidation, duplicationValidation);

      // If critical violations, regenerate or warn
      if (!validation.passed && validation.violations.some(v => v.severity === 'critical')) {
        set({ error: 'Resposta contém violações críticas. Por favor, tente novamente.' });
        set({ isLoading: false });
        return;
      }

      // Calculate costs
      const cost = calculateCost(
        response.inputTokens,
        response.outputTokens,
        state.settings.modelName
      );

      // Create assistant message
      const assistantMessage: ChatMessage = {
        sessionId,
        role: 'assistant',
        content: response.content,
        tokens: response.outputTokens,
        cost,
        timestamp: new Date(),
        metadata: {
          temperature: state.settings.temperature,
          maxTokens: state.settings.maxTokens,
          memories: context.memories.map(m => m.memory.id!),
          locks: context.locks.map(l => l.id!),
          validationPassed: validation.passed,
          violations: validation.violations.map(v => v.description),
        },
      };

      await db.messages.add(assistantMessage);

      // Update scene state
      let newSceneState = state.sceneState;
      if (!newSceneState) {
        newSceneState = {
          sessionId,
          charactersPresent: [],
          location: '',
          mentions: [],
          currentParagraph: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.scenes.add(newSceneState);
      } else {
        const updatedMentions = updateSceneMentions(
          response.content,
          newSceneState,
          newSceneState.currentParagraph + 1
        );
        await db.scenes.update(newSceneState.id!, {
          mentions: updatedMentions,
          currentParagraph: newSceneState.currentParagraph + 1,
          updatedAt: new Date(),
        });
        newSceneState.mentions = updatedMentions;
        newSceneState.currentParagraph++;
      }

      // Update session stats
      const totalTokens = state.currentSession.totalTokens + response.inputTokens + response.outputTokens;
      const totalCost = state.currentSession.totalCost + cost;

      await db.sessions.update(state.currentSession.id!, {
        totalTokens,
        totalCost,
        messageCount: state.currentSession.messageCount + 2,
        updatedAt: new Date(),
      });

      // Update memories usage count
      for (const item of context.memories) {
        if (item.memory.id) {
          await db.memories.update(item.memory.id, {
            lastUsed: new Date(),
            usageCount: item.memory.usageCount + 1,
            updatedAt: new Date(),
          });
        }
      }

      // Reload data
      await get().loadSession(state.currentSession.id!);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Memory actions
  addMemory: async (memory) => {
    try {
      await db.memories.add({
        ...memory,
        lastUsed: null,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await get().loadMemories();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add memory' });
    }
  },

  updateMemory: async (id, updates) => {
    try {
      await db.memories.update(id, { ...updates, updatedAt: new Date() });
      await get().loadMemories();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update memory' });
    }
  },

  deleteMemory: async (id) => {
    try {
      await db.memories.delete(id);
      await get().loadMemories();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete memory' });
    }
  },

  loadMemories: async () => {
    try {
      const memories = await db.memories.toArray();
      set({ memories });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load memories' });
    }
  },

  // Lock actions
  addLock: async (lock) => {
    try {
      await db.locks.add({
        ...lock,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await get().loadLocks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add lock' });
    }
  },

  updateLock: async (id, updates) => {
    try {
      await db.locks.update(id, { ...updates, updatedAt: new Date() });
      await get().loadLocks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update lock' });
    }
  },

  deleteLock: async (id) => {
    try {
      await db.locks.delete(id);
      await get().loadLocks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete lock' });
    }
  },

  loadLocks: async () => {
    try {
      const locks = await db.locks.toArray();
      set({ locks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load locks' });
    }
  },

  // Settings actions
  updateSettings: async (updates) => {
    const state = get();
    if (!state.settings) return;

    try {
      const newSettings = { ...state.settings, ...updates, updatedAt: new Date() };
      await db.settings.update(state.settings.id!, newSettings);

      // Update AI service if API settings changed
      if (updates.apiKey || updates.apiProvider || updates.modelName || updates.apiBaseUrl) {
        // Use real AI service if:
        // 1. Has API key, OR
        // 2. Using custom proxy (baseURL is not default Anthropic)
        const isCustomProxy = newSettings.apiBaseUrl &&
                              newSettings.apiBaseUrl !== 'https://api.anthropic.com' &&
                              !newSettings.apiBaseUrl.includes('anthropic.com');

        const aiService = newSettings.apiKey || isCustomProxy
          ? new AIService(newSettings)
          : new MockAIService(newSettings);
        set({ aiService });
      }

      await get().loadSettings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update settings' });
    }
  },

  loadSettings: async () => {
    try {
      const settings = await db.settings.toArray();
      if (settings.length > 0) {
        const currentSettings = settings[0];
        set({ settings: currentSettings });

        // Initialize AI service
        // Use real AI service if:
        // 1. Has API key, OR
        // 2. Using custom proxy (baseURL is not default Anthropic)
        const isCustomProxy = currentSettings.apiBaseUrl &&
                              currentSettings.apiBaseUrl !== 'https://api.anthropic.com' &&
                              !currentSettings.apiBaseUrl.includes('anthropic.com');

        const aiService = currentSettings.apiKey || isCustomProxy
          ? new AIService(currentSettings)
          : new MockAIService(currentSettings);
        set({ aiService });

        // Update token budget
        set({
          tokenUsage: {
            ...get().tokenUsage,
            budget: currentSettings.tokenBudget,
          },
        });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load settings' });
    }
  },

  testConnection: async () => {
    const state = get();

    if (!state.aiService) {
      return {
        success: false,
        message: 'Serviço de IA não inicializado',
      };
    }

    try {
      const result = await state.aiService.testConnection();
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao testar conexão',
      };
    }
  },

  // UI actions
  setView: (view) => set({ currentView: view }),
  clearError: () => set({ error: null }),
}));
