import { HttpClient, HttpClientConfig } from './http-client';
import { NogalTicketPayload } from '@/types/nogal_tickets.types';

export class NogalApiClient extends HttpClient {
  constructor(config: Omit<HttpClientConfig, 'baseURL'>) {
    super({
      ...config,
      baseURL: process.env.NOGAL_API_URL || 'https://api.nogal.com',
      headers: {
        ...config.headers,
        'X-API-Key': process.env.NOGAL_API_KEY || '',
      }
    });
  }

  async createTicket(ticket: NogalTicketPayload): Promise<{ ticketId: string }> {
    const response = await this.post<{ ticketId: string }>('/api/v1/tickets', ticket);
    return response.data;
  }

  async getTicketStatus(ticketId: string): Promise<{ status: string }> {
    const response = await this.get<{ status: string }>(`/api/v1/tickets/${ticketId}/status`);
    return response.data;
  }

  async updateTicket(ticketId: string, updates: Partial<NogalTicketPayload>): Promise<void> {
    await this.patch(`/api/v1/tickets/${ticketId}`, updates);
  }
}

// Crear una instancia por defecto
export const nogalApiClient = new NogalApiClient({
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  }
}); 