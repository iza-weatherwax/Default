/**
 * Token Counter Utility
 * Estimates token count for Claude models
 */

export interface TokenCount {
  tokens: number;
  cost: number;
}

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
  },
  'claude-3-opus-20240229': {
    input: 15.0,
    output: 75.0,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
  },
};

/**
 * Estimate token count using character-based approximation
 * Claude generally uses ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Average of 4 characters per token for English
  const charCount = text.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  return estimatedTokens;
}

/**
 * Calculate cost for input and output tokens
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string = 'claude-3-5-sonnet-20241022'
): number {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-5-sonnet-20241022'];

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

/**
 * Get token count and cost for a text
 */
export function getTokenInfo(
  text: string,
  isOutput: boolean = false,
  model: string = 'claude-3-5-sonnet-20241022'
): TokenCount {
  const tokens = estimateTokens(text);
  const cost = isOutput
    ? calculateCost(0, tokens, model)
    : calculateCost(tokens, 0, model);

  return { tokens, cost };
}

/**
 * Format cost as currency
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count with thousands separator
 */
export function formatTokens(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Check if token budget is exceeded
 */
export function isBudgetExceeded(
  currentTokens: number,
  budget: number
): boolean {
  return currentTokens > budget;
}

/**
 * Calculate remaining budget percentage
 */
export function getBudgetPercentage(
  currentTokens: number,
  budget: number
): number {
  if (budget === 0) return 0;
  return Math.min(100, (currentTokens / budget) * 100);
}
