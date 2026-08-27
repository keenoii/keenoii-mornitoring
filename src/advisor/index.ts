import { AIProvider } from './types';
import { OllamaAdvisor } from './providers/ollama';
import { GeminiAdvisor } from './providers/gemini';
import { TyphoonAdvisor } from './providers/typhoon';
import { RuleEngineAdvisor } from './providers/rule-engine';

export * from './types';
export * from './privacy';
export * from './prompt';

export async function getAIAdvisor(preferredProvider = 'auto', apiKeyOverride?: string): Promise<AIProvider> {
  const ollama = new OllamaAdvisor();
  const gemini = new GeminiAdvisor(apiKeyOverride);
  const typhoon = new TyphoonAdvisor(apiKeyOverride);
  const ruleEngine = new RuleEngineAdvisor();

  if (preferredProvider === 'typhoon') {
    return typhoon;
  }

  if (preferredProvider === 'ollama') {
    return ollama;
  }

  if (preferredProvider === 'gemini') {
    return gemini;
  }

  if (preferredProvider === 'rule-engine') {
    return ruleEngine;
  }

  // 'auto' mode: Detect best available
  const isTyphoonAvailable = await typhoon.isAvailable();
  if (isTyphoonAvailable) {
    return typhoon;
  }

  const isOllamaRunning = await ollama.isAvailable();
  if (isOllamaRunning) {
    return ollama;
  }

  const isGeminiAvailable = await gemini.isAvailable();
  if (isGeminiAvailable) {
    return gemini;
  }

  return ruleEngine;
}
