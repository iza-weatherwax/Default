import type { CharacterLock, SceneState, ValidationResult, MentionTracker } from '../types';

/**
 * Validation and Duplication Detection System
 */

/**
 * Check if text violates any character locks
 */
export function validateLocks(
  text: string,
  locks: CharacterLock[]
): ValidationResult {
  const violations: ValidationResult['violations'] = [];

  locks.forEach(lock => {
    // Check prohibited words
    const lowerText = text.toLowerCase();
    const foundProhibited = lock.prohibitedWords.some(word =>
      lowerText.includes(word.toLowerCase())
    );

    if (foundProhibited) {
      violations.push({
        type: 'lock',
        description: `Violação da trava "${lock.rule}" para personagem ${lock.characterName}`,
        severity: 'critical',
        lockId: lock.id,
        suggestion: lock.autoCorrect
          ? 'Correção automática disponível'
          : 'Regeneração necessária',
      });
    }

    // Check detection pattern
    if (lock.detectionPattern) {
      try {
        const pattern = new RegExp(lock.detectionPattern, 'gi');
        if (pattern.test(text)) {
          violations.push({
            type: 'lock',
            description: `Padrão proibido detectado: ${lock.rule}`,
            severity: 'critical',
            lockId: lock.id,
            suggestion: lock.autoCorrect
              ? 'Correção automática disponível'
              : 'Regeneração necessária',
          });
        }
      } catch (e) {
        console.error('Invalid regex pattern:', lock.detectionPattern);
      }
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Check for duplicated content in the scene
 */
export function checkDuplication(
  text: string,
  sceneState: SceneState | null,
  currentParagraph: number
): ValidationResult {
  const violations: ValidationResult['violations'] = [];

  if (!sceneState || !sceneState.mentions) {
    return { passed: true, violations: [] };
  }

  // Extract sentences or phrases from the new text
  const newPhrases = extractPhrases(text);

  newPhrases.forEach(phrase => {
    // Find existing mentions
    const existing = sceneState.mentions.find(m =>
      isSimilarPhrase(m.text, phrase)
    );

    if (existing) {
      // Check if mentioned too many times
      if (existing.count >= 2) {
        violations.push({
          type: 'duplication',
          description: `"${phrase}" foi mencionado ${existing.count + 1} vezes`,
          severity: 'warning',
          suggestion: 'Considere reformular ou omitir',
        });
      }

      // Check if mentioned too recently
      const paragraphsSince = currentParagraph - existing.lastMentioned;
      if (paragraphsSince < 5) {
        violations.push({
          type: 'duplication',
          description: `"${phrase}" foi mencionado há apenas ${paragraphsSince} parágrafos`,
          severity: 'info',
          suggestion: 'Pode ser repetitivo',
        });
      }
    }
  });

  return {
    passed: violations.filter(v => v.severity === 'critical').length === 0,
    violations,
  };
}

/**
 * Extract meaningful phrases from text
 */
function extractPhrases(text: string): string[] {
  // Split by sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const phrases: string[] = [];

  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);

    // Extract 3-5 word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 4).join(' ').toLowerCase();
      if (phrase.length > 10) {
        phrases.push(phrase);
      }
    }
  });

  return phrases;
}

/**
 * Check if two phrases are similar
 */
function isSimilarPhrase(phrase1: string, phrase2: string): boolean {
  const p1 = phrase1.toLowerCase().trim();
  const p2 = phrase2.toLowerCase().trim();

  // Exact match
  if (p1 === p2) return true;

  // Calculate similarity
  const words1 = p1.split(/\s+/);
  const words2 = p2.split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const similarity = intersection.size / union.size;

  return similarity > 0.7;
}

/**
 * Update scene state with new mentions
 */
export function updateSceneMentions(
  text: string,
  sceneState: SceneState,
  currentParagraph: number
): MentionTracker[] {
  const phrases = extractPhrases(text);
  const mentions = [...sceneState.mentions];

  phrases.forEach(phrase => {
    const existing = mentions.find(m => isSimilarPhrase(m.text, phrase));

    if (existing) {
      existing.count++;
      existing.lastMentioned = currentParagraph;
      existing.paragraphs.push(currentParagraph);
    } else {
      mentions.push({
        text: phrase,
        count: 1,
        paragraphs: [currentParagraph],
        lastMentioned: currentParagraph,
      });
    }
  });

  return mentions;
}

/**
 * Check consistency of character attributes
 */
export function checkCharacterConsistency(
  text: string,
  characterName: string,
  locks: CharacterLock[]
): ValidationResult {
  const violations: ValidationResult['violations'] = [];

  const characterLocks = locks.filter(
    lock => lock.characterName.toLowerCase() === characterName.toLowerCase()
  );

  characterLocks.forEach(lock => {
    // Check if character is mentioned
    const mentionsCharacter = text
      .toLowerCase()
      .includes(characterName.toLowerCase());

    if (mentionsCharacter) {
      // Check for prohibited attributes
      lock.prohibitedWords.forEach(word => {
        if (text.toLowerCase().includes(word.toLowerCase())) {
          violations.push({
            type: 'consistency',
            description: `${characterName} não deve ter: ${word}`,
            severity: 'critical',
            lockId: lock.id,
            suggestion: `Remover "${word}" ou regenerar`,
          });
        }
      });
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(
  ...validations: ValidationResult[]
): ValidationResult {
  const allViolations = validations.flatMap(v => v.violations);

  return {
    passed: allViolations.filter(v => v.severity === 'critical').length === 0,
    violations: allViolations,
  };
}
