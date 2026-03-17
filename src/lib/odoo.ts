import xmlrpc from 'xmlrpc';

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_PASSWORD = process.env.ODOO_PASSWORD;

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

export class OdooClient {
  private config: OdooConfig;
  private uid: number | null = null;

  constructor(config?: Partial<OdooConfig>) {
    let urlStr = config?.url || process.env.ODOO_URL || '';
    // Clean URL if it contains /web#...
    if (urlStr.includes('/web')) {
      urlStr = urlStr.split('/web')[0];
    }
    
    this.config = {
      url: urlStr,
      db: config?.db || process.env.ODOO_DB || '',
      username: config?.username || process.env.ODOO_USERNAME || '',
      password: config?.password || process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD || '',
    };

    if (!this.config.username) {
       console.warn('Odoo Username is missing. Authentication will fail.');
    }
  }

  private async connect(): Promise<number> {
    if (this.uid) return this.uid;

    const url = new URL(this.config.url);
    const client = url.protocol === 'https:' 
      ? xmlrpc.createSecureClient({ host: url.hostname, port: url.port ? parseInt(url.port) : 443, path: '/xmlrpc/2/common' })
      : xmlrpc.createClient({ host: url.hostname, port: url.port ? parseInt(url.port) : 80, path: '/xmlrpc/2/common' });

    return new Promise((resolve, reject) => {
      client.methodCall('authenticate', [this.config.db, this.config.username, this.config.password, {}], (error, value) => {
        if (error) {
          reject(error);
        } else {
          if (!value) reject(new Error('Authentication failed'));
          this.uid = value as number;
          resolve(this.uid);
        }
      });
    });
  }

  async searchRead(model: string, domain: any[] = [], fields: string[] = [], limit: number = 10): Promise<any[]> {
    const uid = await this.connect();
    const url = new URL(this.config.url);
    const client = url.protocol === 'https:' 
      ? xmlrpc.createSecureClient({ host: url.hostname, port: url.port ? parseInt(url.port) : 443, path: '/xmlrpc/2/object' })
      : xmlrpc.createClient({ host: url.hostname, port: url.port ? parseInt(url.port) : 80, path: '/xmlrpc/2/object' });

    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', [
        this.config.db, 
        uid, 
        this.config.password, 
        model, 
        'search_read', 
        [domain], 
        { fields, limit }
      ], (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value as any[]);
        }
      });
    });
  }
}

export const odoo = new OdooClient();

export const odooProducts = new OdooClient({
  url: process.env.ODOO_PRODUCTS_URL,
  db: process.env.ODOO_PRODUCTS_DB,
  username: process.env.ODOO_PRODUCTS_USERNAME,
  password: process.env.ODOO_PRODUCTS_API_KEY,
});
