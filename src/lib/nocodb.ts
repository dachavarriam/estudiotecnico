export class NocoDBClient {
  private baseUrl: string;
  private apiToken: string;

  constructor(config?: { url?: string; apiToken?: string }) {
    const baseUrl = process.env.NOCODB_URL;
    const apiToken = process.env.NOCODB_API_TOKEN;

    if (!baseUrl || !apiToken) {
      console.warn('NocoDB credentials not fully configured');
    }

    this.baseUrl = config?.url || process.env.NOCODB_URL || '';
    this.apiToken = config?.apiToken || process.env.NOCODB_API_TOKEN || '';
  }

  // Helper to get ID if name passed?
  // For now, we will update callers to use constants.
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    // Lazy load env vars if missing (helper for scripts/testing)
    const baseUrl = this.baseUrl || process.env.NOCODB_URL;
    const apiToken = this.apiToken || process.env.NOCODB_API_TOKEN;

    if (!baseUrl || !apiToken) {
         throw new Error("NocoDB Configuration Missing: NOCODB_URL or NOCODB_API_TOKEN not set.");
    }

    // If path starts with 'supplies' or other known names, we might want to swap it?
    // But better to update the strings at the source.
    const url = `${baseUrl}/api/v1/db/data/noco/${process.env.NOCODB_PROJECT_ID}/${path}`;
    console.log(`[NocoDB] Requesting Table: ${path.split('?')[0]}`);

    const res = await fetch(url, {
      ...options,
      headers: {
        'xc-token': apiToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      // throw new Error(`NocoDB API Error: ${res.status} ${res.statusText} - ${errorBody}`);
      console.error(`NocoDB Error for ${url}: ${res.status} - ${errorBody}`);
      throw new Error(`NocoDB API Error: ${res.status}`);
    }

    return res.json();
  }

  async list(tableName: string, params: Record<string, any> = {}) {
    // Construct query parameters
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    
    return this.request(`${tableName}?${searchParams.toString()}`);
  }

  async create(tableName: string, data: any) {
    return this.request(tableName, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(tableName: string, id: string | number, data: any) {
    return this.request(`${tableName}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(tableName: string, id: string | number) {
    return this.request(`${tableName}/${id}`, {
      method: 'DELETE',
    });
  }

  async link(tableName: string, id: string | number, relationColumnName: string, childId: string | number) {
    // Try generic link path
    return this.request(`${tableName}/${id}/views/Table/relations/${relationColumnName}/${childId}`, {
      method: 'POST',
    });
  }

  async upload(formData: FormData) {
    const baseUrl = this.baseUrl || process.env.NOCODB_URL;
    const apiToken = this.apiToken || process.env.NOCODB_API_TOKEN;

    const url = `${baseUrl}/api/v1/db/storage/upload?path=`; 
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'xc-token': apiToken!,
            // Content-Type is set automatically with FormData
        },
        body: formData
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload Failed: ${text}`);
    }
    return response.json();
  }
}

export const nocodb = new NocoDBClient();
