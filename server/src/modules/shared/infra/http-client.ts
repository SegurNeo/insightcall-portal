import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface HttpClientConfig extends AxiosRequestConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export class HttpClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

export class HttpClient {
  private client: AxiosInstance;

  constructor(config: HttpClientConfig) {
    this.client = axios.create({
      timeout: 30000, // Default timeout: 30s
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    // Interceptor para logging y transformación de errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.message || error.message;
        const status = error.response?.status;
        const code = error.response?.data?.code;

        console.error(`HTTP Error [${status}]:`, {
          url: error.config?.url,
          method: error.config?.method,
          message,
          code,
        });

        throw new HttpClientError(message, status, code, error.response?.data);
      }
    );
  }

  private formatResponse<T>(response: AxiosResponse): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    };
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.formatResponse<T>(response);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.formatResponse<T>(response);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.formatResponse<T>(response);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.delete<T>(url, config);
    return this.formatResponse<T>(response);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    const response = await this.client.patch<T>(url, data, config);
    return this.formatResponse<T>(response);
  }
} 