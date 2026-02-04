import type { Memory, CharacterLock, ContextItem, SelectedContext } from '../types';
import { searchMemories } from './semanticSearch';
import { estimateTokens } from './tokenCounter';

/**
 * Priority Queue and Context Selection System
 */

interface PriorityItem {
  item: Memory;
  priority: number;
  relevance: number;
  tokens: number;
}

/**
 * Select memories and locks for context based on relevance and priority
 */
export async function selectContext(
  query: string,
  memories: Memory[],
  locks: CharacterLock[],
  tokenBudget: number
): Promise<SelectedContext> {
  const selectedMemories: ContextItem[] = [];
  let usedTokens = 0;

  // Step 1: Always include all locks (they are mandatory)
  const locksText = locks.map(l => `[LOCK] ${l.characterName}: ${l.rule}`).join('\n');
  const locksTokens = estimateTokens(locksText);
  usedTokens += locksTokens;

  // Step 2: Search for relevant memories using semantic search
  const searchResults = searchMemories(query, memories, memories.length, 0);

  // Step 3: Create priority queue
  const priorityQueue: PriorityItem[] = searchResults.map(({ memory, score }) => {
    const tokens = estimateTokens(memory.text);
    const priority = calculatePriority(memory, score);

    return {
      item: memory,
      priority,
      relevance: score,
      tokens,
    };
  });

  // Sort by priority (higher first)
  priorityQueue.sort((a, b) => b.priority - a.priority);

  // Step 4: Add memories until budget is reached
  for (const item of priorityQueue) {
    if (usedTokens + item.tokens > tokenBudget) {
      break;
    }

    selectedMemories.push({
      memory: item.item,
      relevanceScore: item.relevance,
      priority: item.priority,
    });

    usedTokens += item.tokens;
  }

  // Step 5: Update usage stats for selected memories
  const now = new Date();
  selectedMemories.forEach(({ memory }) => {
    memory.lastUsed = now;
    memory.usageCount = (memory.usageCount || 0) + 1;
  });

  return {
    locks,
    memories: selectedMemories,
    totalTokens: usedTokens,
    budgetUsed: (usedTokens / tokenBudget) * 100,
  };
}

/**
 * Calculate priority score for a memory
 * Priority = importance weight + relevance weight + recency weight
 */
function calculatePriority(memory: Memory, relevanceScore: number): number {
  // Importance: 1 (critical) = 4 points, 4 (background) = 1 point
  const importanceWeight = (5 - memory.importance) * 25;

  // Relevance: 0-1 scale, multiply by 40 for weight
  const relevanceWeight = relevanceScore * 40;

  // Recency: recently used memories get slight penalty
  let recencyWeight = 0;
  if (memory.lastUsed) {
    const daysSinceUse = (Date.now() - memory.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    recencyWeight = Math.min(daysSinceUse, 10) * 2; // Max 20 points
  } else {
    recencyWeight = 10; // Never used gets moderate score
  }

  // Usage frequency: less used memories get slight boost (diversity)
  const usageBoost = Math.max(0, 10 - (memory.usageCount || 0));

  const totalPriority = importanceWeight + relevanceWeight + recencyWeight + usageBoost;

  return totalPriority;
}

/**
 * Build context string for LLM prompt
 */
export function buildContextString(context: SelectedContext): string {
  let contextStr = '';

  // Add locks
  if (context.locks.length > 0) {
    contextStr += '=== REGRAS OBRIGATÓRIAS (NUNCA VIOLAR) ===\n';
    context.locks.forEach(lock => {
      contextStr += `- ${lock.characterName}: ${lock.rule}\n`;
    });
    contextStr += '\n';
  }

  // Add memories by category
  const categorizedMemories = {
    character: [] as ContextItem[],
    world: [] as ContextItem[],
    event: [] as ContextItem[],
    relationship: [] as ContextItem[],
  };

  context.memories.forEach(item => {
    categorizedMemories[item.memory.category].push(item);
  });

  // Add each category
  if (categorizedMemories.character.length > 0) {
    contextStr += '=== PERSONAGENS ===\n';
    categorizedMemories.character.forEach(({ memory }) => {
      contextStr += `- ${memory.text}\n`;
    });
    contextStr += '\n';
  }

  if (categorizedMemories.world.length > 0) {
    contextStr += '=== MUNDO ===\n';
    categorizedMemories.world.forEach(({ memory }) => {
      contextStr += `- ${memory.text}\n`;
    });
    contextStr += '\n';
  }

  if (categorizedMemories.relationship.length > 0) {
    contextStr += '=== RELACIONAMENTOS ===\n';
    categorizedMemories.relationship.forEach(({ memory }) => {
      contextStr += `- ${memory.text}\n`;
    });
    contextStr += '\n';
  }

  if (categorizedMemories.event.length > 0) {
    contextStr += '=== EVENTOS IMPORTANTES ===\n';
    categorizedMemories.event.forEach(({ memory }) => {
      contextStr += `- ${memory.text}\n`;
    });
    contextStr += '\n';
  }

  return contextStr;
}

/**
 * Get character-specific locks
 */
export function getCharacterLocks(
  characterName: string,
  allLocks: CharacterLock[]
): CharacterLock[] {
  return allLocks.filter(
    lock => lock.characterName.toLowerCase() === characterName.toLowerCase()
  );
}

/**
 * Get memories by category
 */
export function getMemoriesByCategory(
  category: Memory['category'],
  memories: Memory[]
): Memory[] {
  return memories.filter(m => m.category === category);
}

/**
 * Get critical memories (importance = 1)
 */
export function getCriticalMemories(memories: Memory[]): Memory[] {
  return memories.filter(m => m.importance === 1);
}

/**
 * Get least used memories
 */
export function getLeastUsedMemories(
  memories: Memory[],
  limit: number = 10
): Memory[] {
  return [...memories]
    .sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0))
    .slice(0, limit);
}
