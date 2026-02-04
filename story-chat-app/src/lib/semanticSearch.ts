import type { Memory } from '../types';

/**
 * Simple Semantic Search using TF-IDF and Cosine Similarity
 */

interface TFIDFVector {
  [term: string]: number;
}

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculate term frequency
 */
function calculateTF(tokens: string[]): TFIDFVector {
  const tf: TFIDFVector = {};
  const totalTerms = tokens.length;

  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  // Normalize by total terms
  Object.keys(tf).forEach(term => {
    tf[term] = tf[term] / totalTerms;
  });

  return tf;
}

/**
 * Calculate inverse document frequency
 */
function calculateIDF(documents: string[][]): TFIDFVector {
  const idf: TFIDFVector = {};
  const totalDocs = documents.length;

  // Count documents containing each term
  const docCount: { [term: string]: number } = {};

  documents.forEach(doc => {
    const uniqueTerms = new Set(doc);
    uniqueTerms.forEach(term => {
      docCount[term] = (docCount[term] || 0) + 1;
    });
  });

  // Calculate IDF
  Object.keys(docCount).forEach(term => {
    idf[term] = Math.log(totalDocs / docCount[term]);
  });

  return idf;
}

/**
 * Calculate TF-IDF vector
 */
function calculateTFIDF(
  tf: TFIDFVector,
  idf: TFIDFVector
): TFIDFVector {
  const tfidf: TFIDFVector = {};

  Object.keys(tf).forEach(term => {
    tfidf[term] = tf[term] * (idf[term] || 0);
  });

  return tfidf;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(
  vec1: TFIDFVector,
  vec2: TFIDFVector
): number {
  const terms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  terms.forEach(term => {
    const val1 = vec1[term] || 0;
    const val2 = vec2[term] || 0;

    dotProduct += val1 * val2;
    mag1 += val1 * val1;
    mag2 += val2 * val2;
  });

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Search memories by semantic similarity
 */
export function searchMemories(
  query: string,
  memories: Memory[],
  topK: number = 5,
  minScore: number = 0.1
): Array<{ memory: Memory; score: number }> {
  if (!query || memories.length === 0) {
    return [];
  }

  // Tokenize query
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Tokenize all memories
  const memoryTokens = memories.map(m => tokenize(m.text));

  // Calculate IDF across all documents
  const allDocuments = [queryTokens, ...memoryTokens];
  const idf = calculateIDF(allDocuments);

  // Calculate TF-IDF for query
  const queryTF = calculateTF(queryTokens);
  const queryTFIDF = calculateTFIDF(queryTF, idf);

  // Calculate similarity scores
  const scores = memories.map((memory, index) => {
    const memoryTF = calculateTF(memoryTokens[index]);
    const memoryTFIDF = calculateTFIDF(memoryTF, idf);

    const score = cosineSimilarity(queryTFIDF, memoryTFIDF);

    // Boost score based on importance (1 = critical, 4 = background)
    const importanceBoost = (5 - memory.importance) * 0.1;
    const adjustedScore = score * (1 + importanceBoost);

    // Boost if keywords match
    const keywordMatches = memory.keywords.some(keyword =>
      query.toLowerCase().includes(keyword.toLowerCase())
    );
    const finalScore = keywordMatches ? adjustedScore * 1.3 : adjustedScore;

    return { memory, score: finalScore };
  });

  // Filter by minimum score and sort
  return scores
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Extract keywords from text
 */
export function extractKeywords(
  text: string,
  maxKeywords: number = 5
): string[] {
  const tokens = tokenize(text);

  // Count word frequency
  const frequency: { [word: string]: number } = {};
  tokens.forEach(token => {
    frequency[token] = (frequency[token] || 0) + 1;
  });

  // Sort by frequency and take top N
  const keywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  return keywords;
}

/**
 * Calculate relevance score for context selection
 */
export function calculateRelevanceScore(
  query: string,
  memory: Memory
): number {
  const queryTokens = tokenize(query);
  const memoryTokens = tokenize(memory.text);

  if (queryTokens.length === 0 || memoryTokens.length === 0) {
    return 0;
  }

  // Simple token overlap
  const querySet = new Set(queryTokens);
  const memorySet = new Set(memoryTokens);

  const intersection = new Set(
    [...querySet].filter(x => memorySet.has(x))
  );

  const overlap = intersection.size / Math.sqrt(querySet.size * memorySet.size);

  // Apply importance boost
  const importanceBoost = (5 - memory.importance) * 0.15;
  const score = overlap * (1 + importanceBoost);

  return score;
}
