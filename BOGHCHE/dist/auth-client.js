// The storefront uses the same origin for its API and session cookies.
const BOGHCHE_AUTH_ENABLED = ['http:', 'https:'].includes(location.protocol);

async function requestJson(path, options) {
  const response = await fetch(path, options);
  let data;
  try { data = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(data?.error || (response.status === 429 ? 'RATE_LIMITED' : 'REQUEST_FAILED'));
    error.status = response.status;
    throw error;
  }
  if (!data || typeof data !== 'object') throw new Error('INVALID_RESPONSE');
  return data;
}

async function storeRequest(path, method, payload) {
  if (!BOGHCHE_AUTH_ENABLED) throw new Error('AUTH_NOT_CONFIGURED');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const options = {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: controller.signal,
    headers: { Accept: 'application/json' }
  };
  try {
    if (method !== 'GET') {
      const csrf = await requestJson('/api/auth/csrf', options);
      if (typeof csrf.token !== 'string' || !csrf.token) throw new Error('INVALID_RESPONSE');
      options.method = method;
      options.headers['X-CSRF-Token'] = csrf.token;
      if (payload !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(payload);
      }
    }
    return await requestJson(path, options);
  } finally {
    clearTimeout(timeout);
  }
}

const AuthClient = Object.freeze({
  enabled: BOGHCHE_AUTH_ENABLED,
  get(path) { return storeRequest(path, 'GET'); },
  write(path, payload, method = 'POST') { return storeRequest(path, method, payload); },
  async request(action, payload) {
    const paths = { login: 'login', signup: 'signup', forgot: 'password-reset', session: 'session', logout: 'logout' };
    if (!Object.hasOwn(paths, action)) throw new Error('INVALID_ACTION');
    const method = action === 'session' ? 'GET' : 'POST';
    const data = await storeRequest('/api/auth/' + paths[action], method, payload);
    if (['login', 'signup', 'session'].includes(action) &&
        (!data.user || typeof data.user.name !== 'string' || typeof data.user.email !== 'string')) {
      throw new Error('INVALID_RESPONSE');
    }
    return data;
  }
});
