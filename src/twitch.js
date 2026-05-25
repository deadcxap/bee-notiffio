export class TwitchApi {
  constructor({ clientId, clientSecret }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async getUserByLogin(login) {
    const params = new URLSearchParams({ login: login.toLowerCase() });
    const payload = await this.helix(`/users?${params}`);
    return payload.data?.[0] || null;
  }

  async getStreamsByLogins(logins) {
    if (logins.length === 0) return new Map();

    const result = new Map();
    const uniqueLogins = [...new Set(logins.map((login) => login.toLowerCase()))];

    for (const batch of chunks(uniqueLogins, 100)) {
      const params = new URLSearchParams();
      for (const login of batch) params.append('user_login', login);
      const payload = await this.helix(`/streams?${params}`);

      for (const stream of payload.data || []) {
        result.set(stream.user_login.toLowerCase(), stream);
      }
    }

    return result;
  }

  async helix(path) {
    const token = await this.getAppAccessToken();
    const response = await fetch(`https://api.twitch.tv/helix${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Client-Id': this.clientId
      }
    });

    if (response.status === 401) {
      this.token = null;
      this.tokenExpiresAt = 0;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Twitch API failed: ${response.status} ${body}`);
    }

    return response.json();
  }

  async getAppAccessToken() {
    const now = Date.now();
    if (this.token && now < this.tokenExpiresAt - 60_000) {
      return this.token;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    });

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitch auth failed: ${response.status} ${text}`);
    }

    const payload = await response.json();
    this.token = payload.access_token;
    this.tokenExpiresAt = now + payload.expires_in * 1000;
    return this.token;
  }
}

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
