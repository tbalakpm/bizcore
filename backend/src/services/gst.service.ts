import crypto from 'node:crypto';
import https from 'node:https';

export interface GstinDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string;
  mobile?: string;
  gstin: string;
}

export interface CaptchaResponse {
  captcha: string; // Base64 image
  sessionId: string;
}

interface SessionData {
  cookies: string[];
  createdAt: number;
}

// Utility to make HTTPS requests with cookies and proper TLS handling
async function httpRequest(url: string, options: any = {}): Promise<{ body: string | Buffer; headers: any; status: number }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000,
      rejectUnauthorized: false,
    };

    const req = https.request(reqOptions, (res) => {
      let data: any[] = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        let body = buffer as any;
        if (options.json && buffer.length > 0) {
          try {
            body = JSON.parse(buffer.toString());
          } catch (e) {
            console.error('Failed to parse JSON response', buffer.toString());
          }
        }
        resolve({
          body,
          headers: res.headers,
          status: res.statusCode || 0
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

export class GstService {
  private sessions = new Map<string, SessionData>();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [id, data] of this.sessions.entries()) {
        if (now - data.createdAt > this.SESSION_TIMEOUT) {
          this.sessions.delete(id);
        }
      }
    }, 60000);
  }

  async getCaptcha(): Promise<CaptchaResponse> {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const commonHeaders = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    try {
      // 1. Establish session
      const searchRes = await httpRequest('https://services.gst.gov.in/services/searchtp', { headers: commonHeaders });
      if (searchRes.status !== 200) throw new Error('Failed to establish session');

      const initialCookies = (searchRes.headers['set-cookie'] as string[]) || [];

      // 2. Fetch captcha
      const captchaRes = await httpRequest('https://services.gst.gov.in/services/captcha', {
        headers: {
          ...commonHeaders,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Cookie': initialCookies.map((c: string) => c.split(';')[0]).join('; '),
          'Referer': 'https://services.gst.gov.in/services/searchtp'
        }
      });

      if (captchaRes.status !== 200) throw new Error('Failed to fetch captcha');

      const buffer = captchaRes.body as Buffer;
      const base64 = buffer.toString('base64');

      const allCookies = [...initialCookies, ...((captchaRes.headers['set-cookie'] as string[]) || [])];
      const sessionId = crypto.randomUUID();
      this.sessions.set(sessionId, {
        cookies: allCookies.map((c: string) => c.split(';')[0]),
        createdAt: Date.now()
      });

      return {
        captcha: `data:image/png;base64,${base64}`,
        sessionId
      };
    } catch (error: any) {
      console.error('GST Captcha Error:', error.message);
      throw error;
    }
  }

  async fetchGstinDetails(gstin: string, captcha: string, sessionId: string): Promise<GstinDetails | null> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session expired. Please refresh captcha.');

    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const url = 'https://services.gst.gov.in/services/api/search/taxpayerDetails';

    const responseData = await httpRequest(url, {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Cookie': session.cookies.join('; '),
        'Referer': 'https://services.gst.gov.in/services/searchtp',
        'Origin': 'https://services.gst.gov.in'
      },
      body: { gstin: gstin.toUpperCase(), captcha: captcha },
      json: true
    });

    const data = responseData.body as any;
    if (!data || data.status_cd === '0') throw new Error(data?.message || 'Invalid captcha or search failed');

    console.log('GSTIN data', data);
    const addr = data.pradr?.addr || {};
    return {
      gstin: data.gstin || gstin,
      name: data.lgnm || data.tradeNam || 'Unknown',
      addressLine1: [addr.bnm, addr.bno, addr.st, addr.loc].filter(Boolean).join(', '),
      addressLine2: addr.flno || '',
      city: addr.dst || addr.city || '',
      state: addr.stcd || '',
      postalCode: addr.pncd || '',
      phone: data.mobNum || '',
      mobile: data.mobNum || ''
    };
  }
}

export const gstService = new GstService();
