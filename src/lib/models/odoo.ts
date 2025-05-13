import axios, { AxiosError } from 'axios';

interface OdooResponse<T> {
  jsonrpc: string;
  result: T;
}

interface OdooError {
  message: string;
  code: number;
  data: {
    message: string;
    debug?: string;
  };
}

export class OdooClient {
  private baseURL: string;
  private db: string;
  private username: string;
  private password: string;
  private uid?: number;

  constructor() {
    if (!process.env.ODOO_API_URL || !process.env.ODOO_USERNAME || !process.env.ODOO_PASSWORD) {
      throw new Error('Missing Odoo environment variables');
    }

    this.baseURL = process.env.ODOO_API_URL;
    this.db = process.env.ODOO_DATABASE || 'gfrom1';
    this.username = process.env.ODOO_USERNAME;
    this.password = process.env.ODOO_PASSWORD;
  }

  async authenticate(): Promise<number> {
    try {
      const response = await axios.post<OdooResponse<{ uid: number }>>(
        `${this.baseURL}/web/session/authenticate`,
        {
          jsonrpc: "2.0",
          params: {
            db: this.db,
            login: this.username,
            password: this.password,
          },
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      this.uid = response.data.result.uid;
      return this.uid;
    } catch (error) {
      const axiosError = error as AxiosError<OdooError>;
      console.error('Odoo authentication failed:', axiosError.response?.data?.data?.message || axiosError.message);
      throw new Error('Authentication failed');
    }
  }

  async fetchData<T>(model: string, fields: string[] = [], domain: [string, string, string | number | boolean][] = [], limit = 80): Promise<T[]> {
    try {
      if (!this.uid) {
        await this.authenticate();
      }

      const response = await axios.post<OdooResponse<T[]>>(
        `${this.baseURL}/web/dataset/search_read`,
        {
          jsonrpc: "2.0",
          params: {
            model,
            fields,
            domain,
            limit,
            context: { lang: 'en_US' }
          },
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.result;
    } catch (error) {
      const axiosError = error as AxiosError<OdooError>;
      console.error('Odoo fetch error:', axiosError.response?.data?.data?.message || axiosError.message);
      throw new Error('Failed to fetch data');
    }
  }
}

export const odoo = new OdooClient();