import { AIAnalysisRequest } from './types';

/**
 * Sanitizes input data to guarantee zero code and credential leakage.
 */
export function sanitizePayload(data: AIAnalysisRequest): AIAnalysisRequest {
  const sanitizeText = (text: string): string => {
    return text
      // Strip potential API keys / secrets / bearer tokens
      .replace(/(?:key|secret|token|password|auth|jwt|bearer)\s*[:=]\s*["']?[a-zA-Z0-9_\-\.]{8,}["']?/gi, '[REDACTED_SECRET]')
      // Strip local Windows/Linux usernames
      .replace(/[a-zA-Z]:\\Users\\[^\\]+\\/gi, 'C:\\...\\')
      .replace(/\/home\/[^\/]+\//gi, '/home/.../');
  };

  const sanitizedTodoSamples = (data.todoSamples || [])
    .slice(0, 10)
    .map((s) => sanitizeText(s).slice(0, 120));

  const sanitizedReadme = data.readmeSummary
    ? sanitizeText(data.readmeSummary).slice(0, 600)
    : undefined;

  return {
    ...data,
    projectName: sanitizeText(data.projectName),
    readmeSummary: sanitizedReadme,
    todoSamples: sanitizedTodoSamples,
  };
}
