/**
 * BuildPaid Governance SDK
 * Deterministic construction governance through a single API.
 *
 * © 2026 BuildPaid · Patent Pending
 * 86 patents filed · 1,663+ claims
 */

const crypto = require('crypto');

const DEFAULT_BASE_URL = 'https://app.buildpaid.ai/api/governance-sdk';
const SDK_VERSION = '1.0.0';

class BuildPaidError extends Error {
  constructor(message, code, method) {
    super(message);
    this.name = 'BuildPaidError';
    this.code = code;
    this.method = method;
  }
}

class SignatureError extends BuildPaidError {
  constructor(method) {
    super('Response signature verification failed — possible tampering', 'SIGNATURE_INVALID', method);
    this.name = 'SignatureError';
  }
}

class BuildPaid {
  /**
   * @param {Object} options
   * @param {string} options.apiKey - API key (bp_xxx format)
   * @param {string} [options.sdkSecret] - HMAC secret for signature verification
   * @param {boolean} [options.verifySignatures=true] - Verify HMAC-SHA256 on every response
   * @param {string} [options.baseUrl] - Override API base URL
   * @param {number} [options.timeout=30000] - Request timeout in ms
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new BuildPaidError('apiKey is required', 'MISSING_KEY');
    }
    this.apiKey = options.apiKey;
    this.sdkSecret = options.sdkSecret || null;
    this.verifySignatures = options.verifySignatures !== false;
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.timeout = options.timeout || 30000;

    // Method namespaces
    this.score = {
      compliance: (params) => this._call('score.compliance', params),
      fundability: (params) => this._call('score.fundability', params),
      bpi: (params) => this._call('score.bpi', params),
      exposure: (params) => this._call('score.exposure', params),
      credit: (params) => this._call('score.credit', params),
      adequacy: (params) => this._call('score.adequacy', params),
    };

    this.compliance = {
      status: (params) => this._call('compliance.status', params),
      gates: (params) => this._call('compliance.gates', params),
      documents: (params) => this._call('compliance.documents', params),
      cpral: (params) => this._call('compliance.cpral', params),
    };

    this.provenance = {
      verify: (params) => this._call('provenance.verify', params),
      export: (params) => this._call('provenance.export', params),
      chain: (params) => this._call('provenance.chain', params),
    };

    this.governance = {
      profile: (params) => this._call('governance.profile', params),
      compile: (params) => this._call('governance.compile', params),
      payment: (params) => this._call('governance.payment', params),
    };

    this.events = {
      subscribe: (params) => this._call('events.subscribe', params),
      recent: (params) => this._call('events.recent', params),
    };
  }

  /**
   * Execute an SDK method call.
   * @param {string} method - Method name (e.g. 'score.compliance')
   * @param {Object} params - Method parameters
   * @returns {Promise<Object>} Response data
   */
  async _call(method, params = {}) {
    const body = JSON.stringify({ method, params });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-BuildPaid-SDK-Version': SDK_VERSION,
        },
        body,
        signal: controller.signal,
      });

      const text = await response.text();

      // Verify HMAC signature if enabled and secret is available
      if (this.verifySignatures && this.sdkSecret) {
        const signature = response.headers.get('x-buildpaid-signature');
        if (signature) {
          const expected = crypto
            .createHmac('sha256', this.sdkSecret)
            .update(text)
            .digest('hex');
          if (expected !== signature) {
            throw new SignatureError(method);
          }
        }
      }

      const data = JSON.parse(text);

      if (!response.ok || data.error) {
        throw new BuildPaidError(
          data.error || `HTTP ${response.status}`,
          data.code || 'API_ERROR',
          method
        );
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new BuildPaidError(`Request timed out after ${this.timeout}ms`, 'TIMEOUT', method);
      }
      if (err instanceof BuildPaidError) throw err;
      throw new BuildPaidError(err.message, 'NETWORK_ERROR', method);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Verify an incoming webhook signature.
   * @param {string} payload - Raw request body
   * @param {string} signature - X-BuildPaid-Signature header value
   * @returns {boolean} True if valid
   */
  verifyWebhook(payload, signature) {
    if (!this.sdkSecret) {
      throw new BuildPaidError('sdkSecret required for webhook verification', 'MISSING_SECRET');
    }
    const expected = crypto
      .createHmac('sha256', this.sdkSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }
}

BuildPaid.BuildPaidError = BuildPaidError;
BuildPaid.SignatureError = SignatureError;
BuildPaid.VERSION = SDK_VERSION;

module.exports = BuildPaid;
