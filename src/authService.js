const axios = require("axios");

class AfyaAuthService {
  constructor(config) {
    this.platformName = config.platformName;
    this.platformKey = config.platformKey;
    this.platformSecret = config.platformSecret;
    this.baseUrl = config.baseUrl;
    this.callbackUrl = config.callbackUrl;
    this.tokens = {};
    this.logs = [];
  }

  _log(level, message, data = null) {
    const entry = { timestamp: new Date().toISOString(), level, message, data };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[${level.toUpperCase()}] ${message}`, data || "");
  }

  _isExpired(expiresAt) {
    return !expiresAt || new Date() >= new Date(expiresAt);
  }

  async initiateHandshake() {
    const payload = {
      platform_name: this.platformName,
      platform_key: this.platformKey,
      platform_secret: this.platformSecret,
      callback_url: this.callbackUrl,
    };

    try {
      const { data } = await axios.post(`${this.baseUrl}/initiate-handshake`, payload, { timeout: 15000 });
      this.tokens.handshake = data.data.handshake_token;
      this.tokens.handshakeExpiresAt = data.data.expires_at;
      this._log("success", "Handshake initiated", data.data);
      return { success: true, payload, response: data };
    } catch (err) {
      const error = err.response?.data || { message: err.message };
      this._log("error", "Initiate failed", error);
      return { success: false, error };
    }
  }

  async completeHandshake() {
    if (!this.tokens.handshake)
      return { success: false, error: { message: "No handshake token. Initiate first." } };
    if (this._isExpired(this.tokens.handshakeExpiresAt)) {
      this.tokens.handshake = null;
      return { success: false, error: { message: "Handshake token expired. Initiate again." } };
    }

    const payload = {
      handshake_token: this.tokens.handshake,
      platform_key: this.platformKey,
    };

    try {
      const { data } = await axios.post(`${this.baseUrl}/complete-handshake`, payload, { timeout: 15000 });
      this.tokens.access = data.data.access_token;
      this.tokens.refresh = data.data.refresh_token;
      this.tokens.accessExpiresAt = data.data.expires_at;
      this.tokens.handshake = null; 
      this._log("success", "Handshake complete — access token acquired", data.data);
      return { success: true, payload, response: data };
    } catch (err) {
      const error = err.response?.data || { message: err.message };
      this._log("error", "Complete failed", error);
      return { success: false, error };
    }
  }

  async runFullFlow() {
    const step1 = await this.initiateHandshake();
    if (!step1.success) return step1;
    return this.completeHandshake();
  }

  getState() {
    return {
      hasHandshakeToken: !!this.tokens.handshake,
      handshakeExpired: this._isExpired(this.tokens.handshakeExpiresAt),
      handshakeExpiresAt: this.tokens.handshakeExpiresAt,
      hasAccessToken: !!this.tokens.access,
      accessExpiresAt: this.tokens.accessExpiresAt,
      accessTokenPreview: this.tokens.access ? this.tokens.access.substring(0, 16) + "..." : null,
    };
  }
}

module.exports = AfyaAuthService;