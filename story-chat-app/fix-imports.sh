#!/bin/bash

# Fix type imports in all TypeScript files

# LockEditor.tsx
sed -i 's/import { CharacterLock }/import type { CharacterLock }/g' src/components/LockEditor.tsx
sed -i 's/, AlertTriangle//g' src/components/LockEditor.tsx

# MemoryManager.tsx
sed -i 's/import { Memory }/import type { Memory }/g' src/components/MemoryManager.tsx

# aiService.ts
sed -i 's/import { AIResponse, AppSettings, ChatMessage, ValidationResult }/import type { AppSettings, ChatMessage }/g' src/lib/aiService.ts

# contextSelection.ts
sed -i 's/import { Memory, CharacterLock, ContextItem, SelectedContext }/import type { Memory, CharacterLock, ContextItem, SelectedContext }/g' src/lib/contextSelection.ts
sed -i 's/searchMemories, calculateRelevanceScore/searchMemories/g' src/lib/contextSelection.ts

# db.ts
sed -i 's/import Dexie, { Table }/import Dexie, type { Table }/g' src/lib/db.ts
sed -i 's/import {$/import type {/g' src/lib/db.ts

# semanticSearch.ts
sed -i 's/import { Memory }/import type { Memory }/g' src/lib/semanticSearch.ts

# validation.ts
sed -i 's/import { CharacterLock, SceneState, ValidationResult, MentionTracker }/import type { CharacterLock, SceneState, ValidationResult, MentionTracker }/g' src/lib/validation.ts

# useAppStore.ts
sed -i 's/import {$/import type {/g' src/stores/useAppStore.ts

echo "Done!"
