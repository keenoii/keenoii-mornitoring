/**
 * Live HTTP & SSL Health Check Service
 * Pure Business Logic Layer - Framework and UI agnostic.
 */

export interface LiveHealthStatus {
  url: string;
  isOnline: boolean;
  statusCode?: number;
  statusText?: string;
  responseTimeMs: number;
  checkedAt: string;
  error?: string;
}

export async function checkLiveUrlHealth(url: string, timeoutMs = 4000): Promise<LiveHealthStatus> {
  const startTime = Date.now();
  const checkedAt = new Date().toISOString();

  // Normalize URL protocol
  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'KEENOII-Sentinel-Monitor/1.2 (+https://github.com/keenoii)',
      },
      cache: 'no-store',
    });

    clearTimeout(timer);
    const responseTimeMs = Date.now() - startTime;
    const isOnline = response.status >= 200 && response.status < 400;

    return {
      url: targetUrl,
      isOnline,
      statusCode: response.status,
      statusText: response.statusText,
      responseTimeMs,
      checkedAt,
      error: !isOnline ? `HTTP ${response.status} ${response.statusText}` : undefined,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err?.name === 'AbortError';

    return {
      url: targetUrl,
      isOnline: false,
      responseTimeMs,
      checkedAt,
      error: isTimeout ? `Timeout (${timeoutMs}ms)` : err?.message || 'Connection Refused',
    };
  }
}
