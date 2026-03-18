/**
 * Circuit breaker for external services (e.g. AI service).
 * When failures exceed threshold, fail fast instead of long timeouts.
 */
type State = 'closed' | 'open' | 'half-open';

const DEFAULT_THRESHOLD = Math.max(1, parseInt(process.env.AI_CIRCUIT_BREAKER_THRESHOLD || '5', 10) || 5);
const DEFAULT_COOLDOWN_MS = Math.max(5000, parseInt(process.env.AI_CIRCUIT_BREAKER_COOLDOWN_MS || '30000', 10) || 30000);

let state: State = 'closed';
let failures = 0;
let lastFailureTime = 0;
let lastSuccessTime = 0;

export function getState(): State {
  return state;
}

export function getFailures(): number {
  return failures;
}

/**
 * Call fn with circuit breaker. Throws immediately if circuit is open (fail fast).
 */
export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  options?: { threshold?: number; cooldownMs?: number }
): Promise<T> {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
  const cooldownMs = options?.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const now = Date.now();

  if (state === 'open') {
    if (now - lastFailureTime < cooldownMs) {
      throw new Error('AI service unavailable (circuit open). Try again later.');
    }
    state = 'half-open';
  }

  try {
    const result = await fn();
    if (state === 'half-open') {
      state = 'closed';
      failures = 0;
    } else if (state === 'closed') {
      failures = 0;
    }
    lastSuccessTime = now;
    return result;
  } catch (err) {
    failures++;
    lastFailureTime = now;
    if (state === 'half-open' || failures >= threshold) {
      state = 'open';
    }
    throw err;
  }
}

/** Reset circuit (e.g. for testing) */
export function resetCircuit(): void {
  state = 'closed';
  failures = 0;
  lastFailureTime = 0;
  lastSuccessTime = 0;
}
