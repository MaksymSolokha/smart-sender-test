import { ApiError, toApiError } from './errors';

type HttpMethod = 'GET' | 'POST' | 'PUT';

export interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  skipSessionRefresh?: boolean;
}

export interface HttpClientConfig {
  baseUrl?: string;
  getFingerprint: () => string;
}

type SessionExpiredListener = () => void;

const CSRF_HEADER = 'X-CSRF-TOKEN';
const METHODS_WITH_CSRF: ReadonlySet<HttpMethod> = new Set(['POST', 'PUT']);

const ROTATE_PATH = '/auth/token/rotate';
const CSRF_PATH = '/csrf';

export class HttpClient {
  private csrfToken: string | null = null;
  private csrfRequest: Promise<string> | null = null;
  private rotateRequest: Promise<void> | null = null;
  private sessionGeneration = 0;
  private readonly sessionExpiredListeners = new Set<SessionExpiredListener>();

  constructor(private readonly config: HttpClientConfig) {}

  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('POST', path, { ...options, body });
  }

  put<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body });
  }

  onSessionExpired(listener: SessionExpiredListener): () => void {
    this.sessionExpiredListeners.add(listener);
    return () => this.sessionExpiredListeners.delete(listener);
  }

  async request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
    const generationAtStart = this.sessionGeneration;
    let response = await this.sendWithCsrf(method, path, options);

    if (response.status === 401 && !options.skipSessionRefresh) {
      if (generationAtStart === this.sessionGeneration) {
        await this.rotateSession();
      }
      response = await this.sendWithCsrf(method, path, options);
      if (response.status === 401) {
        this.expireSession();
      }
    }

    return parseResponse<T>(response);
  }

  private rotateSession(): Promise<void> {
    this.rotateRequest ??= this.sendWithCsrf('POST', ROTATE_PATH, {
      body: { fingerprint: this.config.getFingerprint() },
    })
      .then(async (response) => {
        if (!response.ok) throw await toApiError(response);
        this.sessionGeneration += 1;
      })
      .catch((error: unknown) => {
        this.expireSession();
        throw error;
      })
      .finally(() => {
        this.rotateRequest = null;
      });

    return this.rotateRequest;
  }

  private expireSession(): void {
    this.sessionExpiredListeners.forEach((listener) => listener());
  }

  private async sendWithCsrf(method: HttpMethod, path: string, options: RequestOptions): Promise<Response> {
    const token = await this.getCsrfToken();
    const response = await this.send(method, path, options, token);
    if (response.status !== 419) return response;

    const freshToken = await this.refreshCsrfToken(token);
    return this.send(method, path, options, freshToken);
  }

  private getCsrfToken(): Promise<string> {
    if (this.csrfToken !== null) return Promise.resolve(this.csrfToken);
    return this.fetchCsrfToken();
  }

  private refreshCsrfToken(staleToken: string): Promise<string> {
    if (this.csrfToken !== null && this.csrfToken !== staleToken) return Promise.resolve(this.csrfToken);
    this.csrfToken = null;
    return this.fetchCsrfToken();
  }

  private fetchCsrfToken(): Promise<string> {
    this.csrfRequest ??= fetch(this.url(CSRF_PATH), {
      method: 'GET',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) throw await toApiError(response);
        const token = response.headers.get(CSRF_HEADER);
        if (!token) throw new ApiError(response.status, 'UnknownError', 'CSRF token header is missing');
        this.csrfToken = token;
        return token;
      })
      .finally(() => {
        this.csrfRequest = null;
      });

    return this.csrfRequest;
  }

  private send(method: HttpMethod, path: string, options: RequestOptions, csrfToken: string): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set('X-Requested-With', 'XMLHttpRequest');
    headers.set('Accept', 'application/json');
    if (METHODS_WITH_CSRF.has(method)) headers.set(CSRF_HEADER, csrfToken);

    const hasBody = options.body !== undefined;
    if (hasBody) headers.set('Content-Type', 'application/json');

    return fetch(this.url(path), {
      method,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: 'same-origin',
    });
  }

  private url(path: string): string {
    return `${this.config.baseUrl ?? ''}${path}`;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
