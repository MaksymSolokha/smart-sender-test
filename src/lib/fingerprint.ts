const STORAGE_KEY = 'device_fingerprint';
const FINGERPRINT_PATTERN = /^[0-9a-f]{32}$/;

let cached: string | null = null;

function generateFingerprint(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function readStoredFingerprint(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && FINGERPRINT_PATTERN.test(stored) ? stored : null;
  } catch {
    return null;
  }
}

function storeFingerprint(fingerprint: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
    return true;
  } catch {
    return false;
  }
}

export function getFingerprint(): string {
  if (cached) return cached;

  const fingerprint = readStoredFingerprint() ?? generateFingerprint();
  storeFingerprint(fingerprint);
  cached = fingerprint;
  return fingerprint;
}
